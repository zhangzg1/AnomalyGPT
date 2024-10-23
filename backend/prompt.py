init = '''Given a prompt, extrapolate as many relationships as possible from it and provide a list of updates.

If an update is a relationship, provide [ENTITY 1,RELATIONSHIP,ENTITY 2]. The relationship is directed, so the order matters.
If an update is related to a color, provide [ENTITY,COLOR]. Color is in hex format.
If an update is related to deleting an entity, provide ["DELETE",ENTITY].

For example:
prompt: Alice is Bob's roommate. Make her node green.
updates:[["Alice","roommate","Bob"],["Alice","#00FF00"]]

prompt: $text
updates:'''

anomaly_list = '''Given a knowledge graph represented as a set of triples in the form of (subject, relation, object), indicating that there is a relation between subject and object.\
Firstly, please understand the content and structure of the entire knowledge graph, learn about the content of each node in the graph and the relationships described between the nodes.\
Then, you need to identify any potentially anomalous nodes in the graph and return an updated list.

If no anomalies are found, return an empty list;
If anomalies are found, return a list of all suspicious anomalous nodes.

Note: Your output result is always a list. If no anomalies are found, output an empty list. If anomalies are detected, output a list of all suspicious anomalous nodes.

For example:
Knowledge Graph: [["Kramer","father","Elaine"],["Kramer","father","George"]]
Updated:["Kramer"]

Knowledge Graph: $graph_data
Updated: '''

anomaly_set = '''Given a knowledge graph represented as a set of triples in the form of (subject, relation, object), indicating that there is a relation between subject and object.\
Then, I will provide you with a list of suspicious anomalous nodes in the graph.

If the list I give you is empty, it means there are no anomalous nodes in the graph;
If the list I give you is not empty, you need to analyze each node in the list one by one. First, you need to retrieve all triples in the triple set that contain the first node, \
then put the obtained triples into a list, and then perform the same analysis for the second node...

Note: Please pay attention to the output format of the following example. If the list I give you is empty, you only need to output an empty set. \
If the list I give you is not empty, the output should be a set with keys as the nodes in the list and values as all the triples obtained about that node.

For example:
Knowledge Graph: [["Kramer","father","Elaine"],["Kramer","father","George"],["James","son","Kitty"]]
Anomaly List: ["Kramer"]
Update: {"Kramer": [["Kramer","father","Elaine"],["Kramer","father","George"]]}

Knowledge Graph: $graph_data
Anomaly List: $node_list
Update:'''

update_kg = '''Given a knowledge graph represented as a set of triples in the form of (subject, relation, object), indicating that there is a relation between subject and object. \
Then, I will provide you with a collection of suspicious anomalous nodes.

If the collection I give you is empty, it means there are no anomalous nodes in the graph;
If the collection I give you is not empty, you need to analyze each node in the collection and determine whether the node is anomalous based on the list of triples corresponding to each node. \
For anomalous nodes, you need to mark them as red (represented in hexadecimal).

Note: Please pay attention to the output format and content in the following example. If the collection I provide is empty, you only need to output the triples of the original knowledge graph.\
If the collection I provide is not empty, add the mark of the nodes judged to be anomalous to the triples list of the original knowledge graph. \
Do not add marks for nodes judged to be normal, and remember not to delete the triple content from the original knowledge graph.

For example:
Knowledge Graph: [["Kramer","father","Elaine"],["Kramer","father","George"],["James","son","Kitty"]]
Suspicious Nodes Collection: {"Kramer":[["Kramer","father","Elaine"],["Kramer","father","George"]]}
Update based on the original knowledge graph: [["Kramer","father","Elaine"],["Kramer","father","George"],["James","son","Kitty"],["Kramer","#FF0000"]]

Knowledge Graph: $graph_data
Suspicious Nodes Collection: $node_set
Update based on the original knowledge graph:'''

excel_get = '''Given a set of text data extracted from Excel, please obtain all the triplet relationships from the data according to the requirements and put them all into a list.

The text data I provide is obtained by using a tool to traverse the Excel workbook, so you can also regard these text data as a set of Excel data. \
Now I need you to extract all the triplets from these data. The form of the triplet is [Entity 1, Relationship, Entity 2]. \
In the entire Excel data, the data in the SENDER_ACCOUNT_ID column serves as Entity 1, the data in the TX_AMOUNT column serves as the Relationship, \
and the data in the RECEIVER_ACCOUNT_ID column serves as Entity 2. Thus, one row of data can extract a triplet, and finally, put all the triplets into a list.

Example:
Excel data:
TX_ID,SENDER_ACCOUNT_ID,RECEIVER_ACCOUNT_ID,TX_TYPE,TX_AMOUNT,TIMESTAMP,IS_FRAUD,ALERT_ID
1,15,28,TRANSFER,45.75,0,FALSE,-1
2,14,28,TRANSFER,50.00,0,FALSE,-1
3,12,32,TRANSFER,65.55,0,FALSE,-1
List: [["15","45.75","28"],["14","50.00","28"],["12","65.55","32"]]

Excel data:
$excel_data
List:'''

account_list = '''Given a transaction network diagram represented by triples, it displays the flow of funds between accounts in the form of triples (sending account, amount, receiving account). \
This network diagram consists of nodes (representing accounts) and edges (representing transactions between accounts), \
where each node represents an account and each edge represents a monetary transaction between two accounts. \
Your task is to deeply analyze this network to identify suspicious abnormal accounts that may be involved in fraudulent or money laundering activities \
(The characteristics of these suspicious abnormal accounts may include frequently conducting multiple transactions of large or small amounts, or a single transaction of a huge amount), \
then return a list containing all suspicious anomalous accounts.

If no abnormal accounts are detected, return an empty list;
If abnormal accounts are detected, return a list containing all suspicious abnormal accounts.

Note: Your output result is always a list. If no anomalies are detected, output an empty list. \
If anomalies are detected, output a list that you think contains all suspicious anomalous accounts.

For example:
Account Transaction Graph: [["A10","250","A20"],["A30","180","A40"],["A20","300","A50"],["A50","90","A10"],["A60","1200","A70"]]
List of Suspicious Anomalous Accounts: ["A60"]

Account Transaction Graph: $transaction_graph
List of Suspicious Anomalous Accounts:'''

account_set = '''Given a transaction network represented by triples (sending account, amount, receiving account), it indicates that a transaction has occurred between two accounts. \
Next, I will provide a list of all suspected abnormal accounts in this transaction network. These abnormal accounts may be involved in illegal activities such as fraud and money laundering, \
such as some accounts frequently conducting multiple transactions of large or small amounts, or a single large transaction.

If the list I provide is empty, it means that no abnormal accounts have been detected in the network;
If the list I provide is not empty, you need to analyze each account in the list one by one. \
First, you need to traverse the entire account transaction network triples, then search within it to obtain all triples related to the first suspicious anomaly account in the list \
(Specially emphasis on all triples that start or end with this account), and then put these triples into a list. \
After that, repeat the same analysis process for the second suspicious anomaly account in the list...

Note: Your output results should follow the format of the following example. If the provided list is empty, you only need to output an empty set. \
If the list is not empty, the output should be a set where the key is the account in the list, and the value is all the retrieved triples related to that account.

For example:
Account transaction network: [["A10","250","A20"],["A30","180","A40"],["A20","300","A60"],["A50","90","A10"],["A60","1200","A70"]]
List of abnormal accounts: ["A60"]
Collection of abnormal accounts: {"A60":[["A60","1200","A70"],["A20","300","A60"]]}

Account transaction network: $transaction_graph
List of abnormal accounts: $account_graph_list
Collection of abnormal accounts:'''

update_account = '''Given a transaction network represented by triples (sending account, amount, receiving account), it indicates that a transaction has occurred between two accounts.\
Then, I will provide you with a collection of suspicious abnormal accounts. In this collection, the key represents the suspicious account, \
and the value is all the retrieved triples related to that account (you can understand it as all transaction records related to that account, including the inflow and outflow of funds).

If the collection I provide to you is empty, it means there are no suspicious abnormal accounts in the account transaction network;
If the collection I provide to you is not empty, you need to analyze each suspicious account in the collection. \
Your task is to determine whether the suspicious account is abnormal based on the list of triples corresponding to each account \
(you can judge by the fund flow of the account, such as whether it frequently conducts multiple transactions of large or small amounts, or a single large transaction). \
If you determine that a suspicious account is abnormal, mark it as red (represented in hexadecimal).

Note: Please operate according to the output format and content in the following example. \
If the collection I provide is empty, you only need to output the triples of the original account transaction network. \
If the collection is not empty, please add the mark of the abnormal account judgment to the triples of the original account transaction network. \
Do not add marks to accounts judged as normal, and remember not to delete the content of the triples in the original account transaction network.(Emphasize again, the content you output is a list)

For example:
Account transaction network: [["A10","250","A20"],["A30","180","A40"],["A20","300","A60"],["A50","90","A10"],["A60","1200","A70"]]
Collection of suspicious abnormal accounts: {"A60":[["A60","1200","A70"],["A20","300","A60"]]}
Update based on the original account transaction network: [["A10","250","A20"],["A30","180","A40"],["A20","300","A60"],["A50","90","A10"],["A60","1200","A70"],["A60","#FF0000"]]

Account transaction network: $transaction_graph
Collection of suspicious abnormal accounts: $account_graph_set
Update based on the original account transaction network:'''
