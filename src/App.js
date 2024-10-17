import './App.css';
import Graph from "react-graph-vis";
import React, {useState} from "react";

const DEFAULT_PARAMS = {
    "model": "gpt-3.5-turbo",
    "temperature": 0.01,
    "max_tokens": 800,
    "top_p": 1,
    "frequency_penalty": 0,
    "presence_penalty": 0
}

const SELECTED_PROMPT = "STATELESS"

const options = {
    layout: {
        hierarchical: false
    },
    edges: {
        color: "#34495e"
    }
};

function App() {
    const [graphState, setGraphState] = useState(
        {
            nodes: [],
            edges: []
        }
    );
    const clearState = () => {
        setGraphState({
            nodes: [],
            edges: []
        })
    };
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

            } else if (update.length === 2 && update[0] == "DELETE") {
                const [_, index] = update;

                var node = current_graph.nodes.find(node => node.id === index);

                if (node === undefined) {
                    return;
                }

                current_graph.nodes = current_graph.nodes.filter(node => node.id !== index);

                current_graph.edges = current_graph.edges.filter(edge => edge.from !== index && edge.to !== index);
            }
        });
        setGraphState(current_graph);
    };

    const queryStatelessPrompt = (prompt, apiKey) => {
        fetch('prompts/stateless.prompt')
            .then(response => response.text())
            .then(text => text.replace("$prompt", prompt))
            .then(prompt => {
                console.log(prompt)

                const params = {...DEFAULT_PARAMS, messages: [{ role: "user", content: prompt }], stop: "\n"};

                const requestOptions = {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + String(apiKey)
                    },
                    body: JSON.stringify(params)
                };
                fetch("https://api.openai.com/v1/chat/completions", requestOptions)
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
                        const {choices} = response;
                        const text = choices[0].message.content;
                        console.log(text);


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
                        const response1 = await fetch("https://api.openai.com/v1/chat/completions", requestOptions1);
                        const responseJson1 = await response1.json();
                        const { choices: choices1 } = responseJson1;
                        const text1 = choices1[0].message.content;
                        console.log(text1);


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
                        const response2 = await fetch("https://api.openai.com/v1/chat/completions", requestOptions2);
                        const responseJson2 = await response2.json();
                        const { choices: choices2 } = responseJson2;
                        const text2 = choices2[0].message.content;
                        console.log(text2)


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
                        const response3 = await fetch("https://api.openai.com/v1/chat/completions", requestOptions3);
                        const responseJson3 = await response3.json();
                        const { choices: choices3 } = responseJson3;
                        const text3 = choices3[0].message.content;
                        console.log(text3);


                        try {
                            const updates = JSON.parse(text3);
                            console.log(updates);
                            updateGraph(updates);
                        } catch (error) {
                            console.log("Text is not valid JSON:", text);
                        }

                        // document.getElementsByClassName("searchBar")[0].value = "";
                        document.body.style.cursor = 'default';
                        document.getElementsByClassName("generateButton")[0].disabled = false;
                    }).catch((error) => {
                    console.log(error);
                    alert(error);
                });
            })
    };

    const queryStatefulPrompt = (prompt, apiKey) => {
        fetch('prompts/stateful.prompt')
            .then(response => response.text())
            .then(text => text.replace("$prompt", prompt))
            .then(text => text.replace("$state", JSON.stringify(graphState)))
            .then(prompt => {
                console.log(prompt)

                const params = {...DEFAULT_PARAMS, messages: [{ role: "user", content: prompt }], stop: "\n"};

                const requestOptions = {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + String(apiKey)
                    },
                    body: JSON.stringify(params)
                };
                fetch('https://api.openai.com/v1/chat/completions', requestOptions)
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
                        const text = choices[0].text;
                        console.log(text);

                        try {
                            const new_graph = JSON.parse(text);
                            setGraphState(new_graph);
                        } catch (error) {
                            console.log("Text is not valid JSON:", text);
                        }

                        // document.getElementsByClassName("searchBar")[0].value = "";
                        document.body.style.cursor = 'default';
                        document.getElementsByClassName("generateButton")[0].disabled = false;
                    }).catch((error) => {
                    console.log(error);
                    alert(error);
                });
            })
    };

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
