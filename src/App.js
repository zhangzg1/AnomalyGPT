import './App.css';
import Graph from "react-graph-vis";
import React, {useState} from "react";

// 定义了向OpenAI API请求时的默认参数
const DEFAULT_PARAMS = {
    "model": "gpt-3.5-turbo",
    "temperature": 0.01,
    "max_tokens": 800,
    "top_p": 1,
    "frequency_penalty": 0,
    "presence_penalty": 0
}

// 表示默认使用无状态的提示（即不会将图的状态发送到API请求中）
const SELECTED_PROMPT = "STATELESS"

const options = {
    layout: {
        hierarchical: false
    },
    edges: {
        color: "#34495e"
    }
};

// 定义一个React函数组件App
function App() {
    // 定义了图的状态，两个数组：节点和边
    const [graphState, setGraphState] = useState(
        {
            nodes: [],
            edges: []
        }
    );
    // 清除图形状态的函数
    const clearState = () => {
        setGraphState({
            nodes: [],
            edges: []
        })
    };
    // 更新图形的函数
    const updateGraph = (updates) => {
        // updates will be provided as a list of lists
        // each list will be of the form [ENTITY1, RELATION, ENTITY2] or [ENTITY1, COLOR]

        var current_graph = JSON.parse(JSON.stringify(graphState));

        if (updates.length === 0) {
            return;
        }

        // check type of first element in updates
        if (typeof updates[0] === "string") {
            // updates is a list of strings
            updates = [updates]
        }

        updates.forEach(update => {
            // 如果更新的长度为3，表示这是一个关系更新（[ENTITY1, RELATION, ENTITY2]），从update中提取实体1、关系和实体2
            if (update.length === 3) {
                // 使用一个新的关系来更新当前的图
                const [entity1, relation, entity2] = update;

                // 检测节点是否存在
                var node1 = current_graph.nodes.find(node => node.id === entity1);
                var node2 = current_graph.nodes.find(node => node.id === entity2);

                if (node1 === undefined) {
                    current_graph.nodes.push({id: entity1, label: entity1, color: "#ffffff"});
                }

                if (node2 === undefined) {
                    current_graph.nodes.push({id: entity2, label: entity2, color: "#ffffff"});
                }

                // 查找实体1和实体2之间的是否存在边，如果存在，则更新其标签为新的关系；如果不存在，则添加新的边
                var edge = current_graph.edges.find(edge => edge.from === entity1 && edge.to === entity2);
                if (edge !== undefined) {
                    edge.label = relation;
                    return;
                }

                current_graph.edges.push({from: entity1, to: entity2, label: relation});

                // 如果更新长度为2，且第二个元素以#开头，说明这是一个颜色更新
            } else if (update.length === 2 && update[1].startsWith("#")) {
                // 使用新的颜色更新当前的图
                const [entity, color] = update;

                // 检测节点是否存在
                var node = current_graph.nodes.find(node => node.id === entity);

                if (node === undefined) {
                    current_graph.nodes.push({id: entity, label: entity, color: color});
                    return;
                }

                // 更新节点的颜色
                node.color = color;

                // 如果update表示删除操作，找到对应节点并从图中删除，同时移除所有与该节点相关的边。
            } else if (update.length === 2 && update[0] == "DELETE") {
                // 在给定的下标中删除这个节点
                const [_, index] = update;

                // 检测节点是否已经存在
                var node = current_graph.nodes.find(node => node.id === index);

                if (node === undefined) {
                    return;
                }

                // 删除节点
                current_graph.nodes = current_graph.nodes.filter(node => node.id !== index);

                // 删除节点包含的所有边
                current_graph.edges = current_graph.edges.filter(edge => edge.from !== index && edge.to !== index);
            }
        });
        setGraphState(current_graph);
    };

    // 无状态提示函数：这个函数会将用户的输入传递给 OpenAI API，请求生成新的图形更新，而不会包含图形的当前状态
    const queryStatelessPrompt = (prompt, apiKey) => {
        fetch('prompts/stateless.prompt')  // 获取无状态提示模板
            .then(response => response.text())   // 读取存储的无状态提示模板文件
            .then(text => text.replace("$prompt", prompt))  // 替换掉模板中的$prompt占位符
            .then(prompt => {
                console.log(prompt)   // 输出完整提示并进行打印

                // 获取之前定义的参数
                const params = {...DEFAULT_PARAMS, messages: [{ role: "user", content: prompt }], stop: "\n"};

                // 向openai发送请求
                const requestOptions = {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + String(apiKey)
                    },
                    body: JSON.stringify(params)   // 将参数序列化为JSON传递给OpenAI API
                };
                fetch("https://api.openai-sb.com/v1/chat/completions", requestOptions)  // 向OpenAI发送请求
                    .then(response => {
                        if (!response.ok) {
                            switch (response.status) {
                                case 401: // 401: Unauthorized: API key is wrong
                                    throw new Error('Please double-check your API key.');
                                case 429: // 429: Too Many Requests: Need to pay
                                    throw new Error('You exceeded your current quota, please check your plan and billing details.');
                                default:
                                    throw new Error('Something went wrong with the request, please check the Network log');
                            }
                        }
                        return response.json();
                    })
                    .then(async (response) => {
                        const {choices} = response;    // 解析API返回的response中的choices
                        const text = choices[0].message.content;
                        console.log(text);             // 输出生成结果，用于调试


                        // 与大模型进行第一次交互检测异常
                        const Template1Response = await fetch('prompts/anomaly_list.prompt');
                        const Template1Text = await Template1Response.text();
                        const Prompt1 = Template1Text.replace("$knowledge_graph", text);
                        console.log(Prompt1);
                        const params1 = {...DEFAULT_PARAMS, messages: [{role: "user", content: Prompt1}], stop: "\n"};
                        const requestOptions1 = {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': 'Bearer ' + String(apiKey)
                            },
                            body: JSON.stringify(params1)
                        };
                        const response1 = await fetch("https://api.openai-sb.com/v1/chat/completions", requestOptions1);
                        const responseJson1 = await response1.json();
                        const { choices: choices1 } = responseJson1;
                        const text1 = choices1[0].message.content;
                        console.log(text1);


                        // 与大模型进行第二次交互检测异常
                        const Template2Response = await fetch('prompts/anomaly_set.prompt');
                        const Template2Text = await Template2Response.text();
                        const Prompt2 = Template2Text
                            .replace("$knowledge_graph", text)
                            .replace("$node_list", text1);
                        console.log(Prompt2);
                        const params2 = {...DEFAULT_PARAMS, messages: [{role: "user", content: Prompt2}], stop: "\n"};
                        const requestOptions2 = {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': 'Bearer ' + String(apiKey)
                            },
                            body: JSON.stringify(params2)
                        };
                        const response2 = await fetch("https://api.openai-sb.com/v1/chat/completions", requestOptions2);
                        const responseJson2 = await response2.json();
                        const { choices: choices2 } = responseJson2;
                        const text2 = choices2[0].message.content;
                        console.log(text2)


                        // 与大模型进行第三次交互检测异常
                        const Template3Response = await fetch('prompts/update_kg.prompt');
                        const Template3Text = await Template3Response.text();
                        const Prompt3 = Template3Text
                            .replace("$knowledge_graph", text)
                            .replace("$node_set", text2);
                        console.log(Prompt3);
                        const params3 = {...DEFAULT_PARAMS, messages: [{role: "user", content: Prompt3}], stop: "\n"};
                        const requestOptions3 = {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': 'Bearer ' + String(apiKey)
                            },
                            body: JSON.stringify(params3)
                        };
                        const response3 = await fetch("https://api.openai-sb.com/v1/chat/completions", requestOptions3);
                        const responseJson3 = await response3.json();
                        const { choices: choices3 } = responseJson3;
                        const text3 = choices3[0].message.content;
                        console.log(text3);


                        try {
                            const updates = JSON.parse(text3);   // 将生成的文本解析为更新指令
                            console.log(updates);                // 打印更新指令
                            updateGraph(updates);                // 更新图形
                        } catch (error) {
                            console.log("Text is not valid JSON:", text);  // 如果解析失败，说明文本不是有效的JSON
                        }

                        // document.getElementsByClassName("searchBar")[0].value = "";  // 清空搜索栏
                        document.body.style.cursor = 'default';  // 重置鼠标指针样式
                        document.getElementsByClassName("generateButton")[0].disabled = false; // 重新启用生成按钮
                    }).catch((error) => {
                    console.log(error);
                    alert(error);
                });
            })
    };

    // 有状态提示函数：该函数除了发送用户输入的提示外，还会发送图形的当前状态，使用现有的图形状态作为上下文来生成新的图形变化
    const queryStatefulPrompt = (prompt, apiKey) => {
        fetch('prompts/stateful.prompt')   // 获取有状态提示模板
            .then(response => response.text())  // 读取文件内容
            .then(text => text.replace("$prompt", prompt))  // 替换模板中的$prompt占位符
            .then(text => text.replace("$state", JSON.stringify(graphState)))  // 替换模板中的$state占位符，包含当前图形状态
            .then(prompt => {
                console.log(prompt)   // 输出替换后的提示

                // 获取之前定义的参数
                const params = {...DEFAULT_PARAMS, messages: [{ role: "user", content: prompt }], stop: "\n"};

                const requestOptions = {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + String(apiKey)
                    },
                    body: JSON.stringify(params)   // 序列化参数并发送请求
                };
                fetch('https://api.openai-sb.com/v1/chat/completions', requestOptions)  // 向OpenAI发送请求
                    .then(response => {
                        if (!response.ok) {
                            switch (response.status) {
                                case 401: // 401: Unauthorized: API key is wrong
                                    throw new Error('Please double-check your API key.');
                                case 429: // 429: Too Many Requests: Need to pay
                                    throw new Error('You exceeded your current quota, please check your plan and billing details.');
                                default:
                                    throw new Error('Something went wrong with the request, please check the Network log');
                            }
                        }
                        return response.json();
                    })
                    .then((response) => {
                        const {choices} = response;
                        const text = choices[0].text;  // 获取生成文本
                        console.log(text);             // 输出生成结果

                        try {
                            const new_graph = JSON.parse(text);  // 解析生成的文本为图形数据
                            setGraphState(new_graph);            // 更新图形状态
                        } catch (error) {
                            console.log("Text is not valid JSON:", text);  // 如果解析失败，说明文本不是有效的JSON
                        }

                        // document.getElementsByClassName("searchBar")[0].value = "";  // 清空搜索栏
                        document.body.style.cursor = 'default';   // 重置鼠标指针
                        document.getElementsByClassName("generateButton")[0].disabled = false;  // 重新启用生成按钮
                    }).catch((error) => {
                    console.log(error);
                    alert(error);
                });
            })
    };

    // 用户选择无状态模式或者有状态模式
    const queryPrompt = (prompt, apiKey) => {
        if (SELECTED_PROMPT === "STATELESS") {
            queryStatelessPrompt(prompt, apiKey);
        } else if (SELECTED_PROMPT === "STATEFUL") {
            queryStatefulPrompt(prompt, apiKey);
        } else {
            alert("Please select a prompt");
            document.body.style.cursor = 'default';
            document.getElementsByClassName("generateButton")[0].disabled = false;
        }
    }


    // 该函数负责处理图形生成的用户输入，并调用 queryPrompt 函数以生成图形
    const createGraph = () => {
        document.body.style.cursor = 'wait';

        document.getElementsByClassName("generateButton")[0].disabled = true;
        const prompt = document.getElementsByClassName("searchBar")[0].value;
        const apiKey = document.getElementsByClassName("apiKeyTextField")[0].value;

        queryPrompt(prompt, apiKey);
    }

    return (
        <div className='container'>
            <h1 className="headerText">GraphGPT 🔎</h1>
            <p className='subheaderText'>Build complex, directed graphs to add structure to your ideas using natural
                language. Understand the relationships between people, systems, and maybe solve a mystery.</p>
            <p className='opensourceText'><a href="https://github.com/varunshenoy/graphgpt">GraphGPT is
                open-source</a>&nbsp;🎉</p>
            <center>
                <div className='inputContainer'>
                    <input className="searchBar" placeholder="Describe your graph..."></input>
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
