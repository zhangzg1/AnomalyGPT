import './App.css';
import Graph from "react-graph-vis";
import React, {useState} from "react";
import * as mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.entry';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;


const options = {
    layout: {
        hierarchical: false
    },
    edges: {
        color: "#34495e"
    }
};

function App() {
    const [graphState, setGraphState] = useState({
        nodes: [],
        edges: []
    });

    const clearState = () => {
        setGraphState({
            nodes: [],
            edges: []
        });
    };

    const [uploadedFile, setUploadedFile] = useState(null);

    const [searchBarValue, setSearchBarValue] = useState('');


    const updateGraph = (updates) => {
        var current_graph = JSON.parse(JSON.stringify(graphState));
        if (updates.length === 0) {
            return;
        }
        if (typeof updates[0] === "string") {
            updates = [updates]
        }

        updates.forEach(update => {
            if (update.length === 3) {
                const [entity1, relation, entity2] = update;
                var node1 = current_graph.nodes.find(node => node.id === entity1);
                var node2 = current_graph.nodes.find(node => node.id === entity2);
                if (node1 === undefined) {
                    current_graph.nodes.push({id: entity1, label: entity1, color: "#ffffff"});
                }
                if (node2 === undefined) {
                    current_graph.nodes.push({id: entity2, label: entity2, color: "#ffffff"});
                }
                var edge = current_graph.edges.find(edge => edge.from === entity1 && edge.to === entity2);
                if (edge !== undefined) {
                    edge.label = relation;
                    return;
                }
                current_graph.edges.push({from: entity1, to: entity2, label: relation});
            } else if (update.length === 2 && update[1].startsWith("#")) {
                const [entity, color] = update;
                var node = current_graph.nodes.find(node => node.id === entity);
                if (node === undefined) {
                    current_graph.nodes.push({id: entity, label: entity, color: color});
                    return;
                }
                node.color = color;
            } else if (update.length === 2 && update[0] === "DELETE") {
                const [, index] = update;
                var nodes = current_graph.nodes.find(node => node.id === index);
                if (nodes === undefined) {
                    return;
                }
                current_graph.nodes = current_graph.nodes.filter(node => node.id !== index);
                current_graph.edges = current_graph.edges.filter(edge => edge.from !== index && edge.to !== index);
            }
        });
        setGraphState(current_graph);
    };


    const queryPrompt = (prompt, api_key) => {
        console.log(prompt)
        fetch('http://127.0.0.1:8000/anomaly/gad?text=' + encodeURIComponent(prompt) + '&api_key=' + encodeURIComponent(api_key))
            .then(response => {
                if (!response.ok) {
                    throw new Error('Something went wrong with the request, please check the Network log');
                }
                return response.json();
            })
            .then((response) => {
                const text = response
                console.log(text);

                try {
                    const updates = JSON.parse(text);    // 将生成的文本解析为更新指令
                    console.log(updates);                // 打印更新指令
                    updateGraph(updates);                // 更新图形
                } catch (error) {
                    console.log("Text is not valid JSON:", text);  // 如果解析失败，说明文本不是有效的JSON
                }

                document.body.style.cursor = 'default';  // 重置鼠标指针
                document.getElementsByClassName("generateButton")[0].disabled = false;   // 重新启用生成按钮
            }).catch((error) => {
            console.log(error);
            alert(error);
            document.body.style.cursor = 'default';
            document.getElementsByClassName("generateButton")[0].disabled = false;
        });
    };


    const queryXLSX = (data, api_key) => {
        console.log(data)
        let formattedData = data.split('\n').join('\\n');
        fetch('http://127.0.0.1:8000/anomaly/aml_gad?data=' + encodeURIComponent(formattedData) + '&api_key=' + encodeURIComponent(api_key))
            .then(response => {
                if (!response.ok) {
                    throw new Error('Something went wrong with the request, please check the Network log');
                }
                return response.json();
            })
            .then((response) => {
                const text = response
                console.log(text);

                try {
                    const updates = JSON.parse(text);
                    console.log(updates);
                    updateGraph(updates);
                } catch (error) {
                    console.log("Text is not valid JSON:", text);
                }

                document.body.style.cursor = 'default';  // 重置鼠标指针
                document.getElementsByClassName("generateButton")[0].disabled = false;
            }).catch((error) => {
            console.log(error);
            alert(error);
            document.body.style.cursor = 'default';
            document.getElementsByClassName("generateButton")[0].disabled = false;
        });
    }


    const createGraph = () => {
        document.body.style.cursor = 'wait';
        document.getElementsByClassName("generateButton")[0].disabled = true;
        const apiKey = document.getElementsByClassName("apiKeyTextField")[0].value;

        if (uploadedFile) {
            const fileName = uploadedFile.name.toLowerCase();
            const fileExtension = fileName.substring(fileName.lastIndexOf('.') + 1);

            if (fileExtension === 'txt' || fileExtension === 'md') {
                // 处理 TXT 文件和 MD 文件
                const reader = new FileReader();
                reader.onload = (e) => {
                    const fileContent = e.target.result;
                    queryPrompt(fileContent, apiKey);
                };
                reader.readAsText(uploadedFile);
            } else if (fileExtension === 'docx') {
                // 处理 DOCX 文件
                handleDocxFile(uploadedFile, apiKey);
            } else if (fileExtension === 'pdf') {
                // 处理 PDF 文件
                handlePdfFile(uploadedFile, apiKey);
            } else if (fileExtension === 'xlsx') {
                // 处理 XLSX 文件
                handleXlsxFile(uploadedFile, apiKey);
            } else if (fileExtension === 'csv') {
                // 处理 CSV 文件
                handleCsvFile(uploadedFile, apiKey);
            } else {
                alert('不支持的文件格式');
                document.body.style.cursor = 'default';
                document.getElementsByClassName("generateButton")[0].disabled = false;
            }
        } else {
            const prompt = document.getElementsByClassName("searchBar")[0].value;
            queryPrompt(prompt, apiKey);
        }
    };


    const handleXlsxFile = (file, apiKey) => {
        const extractTextFromXlsx = (workbook) => {
            let content = '';
            workbook.SheetNames.forEach(sheetName => {
                const worksheet = workbook.Sheets[sheetName];
                const sheetText = XLSX.utils.sheet_to_csv(worksheet);
                content += sheetText + '\n';
            });
            return content;
        };
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = e.target.result;
            const workbook = XLSX.read(data, {type: 'binary'});
            const content = extractTextFromXlsx(workbook); // 提取文本内容
            queryXLSX(content, apiKey); // 调用 queryXLSX 进行异常检测
        };
        reader.readAsBinaryString(file);
    };


    const handleCsvFile = (file, apiKey) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            let csvContent = e.target.result;
            csvContent = csvContent.replace(/[^\w\s.,-]/g, ''); // 提取文本内容并移除特殊字符
            queryXLSX(csvContent, apiKey); // 调用 queryXLSX 进行异常检测
        };
        reader.readAsText(file);
    };


    const handleDocxFile = (file, apiKey) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const arrayBuffer = e.target.result;
            mammoth.extractRawText({arrayBuffer: arrayBuffer})
                .then(function (result) {
                    const text = result.value; // 提取文本内容
                    queryPrompt(text, apiKey); // 调用 queryPrompt 进行异常检测
                })
                .catch(function (err) {
                    console.error('Error extracting DOCX text:', err);
                    alert('无法读取 DOCX 文件内容');
                });
        };
        reader.readAsArrayBuffer(file);
    };


    const handlePdfFile = (file, apiKey) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const typedarray = new Uint8Array(e.target.result);
            pdfjsLib.getDocument(typedarray).promise.then(pdf => {
                let pagesPromises = [];
                for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                    pagesPromises.push(pdf.getPage(pageNum).then(page => {
                        return page.getTextContent().then(textContent => {
                            return textContent.items.map(item => item.str).join(' ');
                        });
                    }));
                }
                Promise.all(pagesPromises).then(pagesText => {
                    const content = pagesText.join('\n'); // 提取文本内容
                    queryPrompt(content, apiKey); // 调用 queryPrompt 进行异常检测
                });
            }).catch(err => {
                console.error('Error extracting PDF text:', err);
                alert('无法读取 PDF 文件内容');
            });
        };
        reader.readAsArrayBuffer(file);
    };


    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            setUploadedFile(file);
            setSearchBarValue('');
        }
    };


    const cancelFileUpload = () => {
        setUploadedFile(null);
        setSearchBarValue('');
    };


    return (
        <div className='container'>
            <h1 className="headerText">GraphGPT 🔎</h1>
            <p className='subheaderText'>Build complex, directed graphs to add structure to your ideas using natural
                language. Understand the relationships between people, systems, and maybe solve a mystery.</p>
            <p className='opensourceText'><a href="https://github.com/varunshenoy/graphgpt">GraphGPT is
                open-source</a>&nbsp;🎉</p>
            <center>
                <div className='inputContainer'>
                    <div className='searchBarWithUpload'>
                        <input
                            className="searchBar"
                            placeholder="Describe your graph..."
                            disabled={uploadedFile !== null}
                            value={searchBarValue}
                            onChange={(e) => setSearchBarValue(e.target.value)}
                        />
                        {uploadedFile ? (
                            <div className='uploadedFile'>
                                <span>{uploadedFile.name}</span>
                                <button className='cancelUploadButton' onClick={cancelFileUpload}>X</button>
                            </div>
                        ) : (
                            <>
                                <input
                                    type="file"
                                    id="fileInput"
                                    style={{display: 'none'}}
                                    onChange={handleFileUpload}
                                />
                                <button
                                    className="fileUploadButton"
                                    onClick={() => document.getElementById('fileInput').click()}
                                >
                                    Upload File
                                </button>
                            </>
                        )}
                    </div>
                    <input className="apiKeyTextField" type="password"
                           placeholder="Enter your OpenAI API key..."></input>
                    <button className="generateButton" onClick={createGraph}>Generate</button>
                    <button className="clearButton" onClick={clearState}>Clear</button>
                </div>
            </center>
            <div className='graphContainer'>
                <Graph graph={graphState} options={options} style={{height: "640px"}}/>
            </div>
            <p className='footer'>Pro tip: don't take a screenshot! You can right-click and save the graph as a .png
                📸</p>
        </div>
    );
}

export default App;

