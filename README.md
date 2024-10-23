# AnomalyGPT

## Introduce

The project has made some improvements based on [GraphGPT](https://github.com/varunshenoy/GraphGPT). Users can not only input text content in the input box on the page but also upload files (supporting txt, md, docx, pdf, csv, xlsx file types). The original GraphGPT can convert natural language into a knowledge graph and display it. Building on this, after the knowledge graph is generated, I designed some prompts to interact with ChatGPT to detect if there are any anomalous nodes in the knowledge graph. If anomalies are detected, the node is marked in red, and finally, the knowledge graph after anomaly detection is displayed.

In addition, AnomalyGPT can not only detect graph anomaly nodes in text graphs but also perform graph anomaly node detection for financial datasets such as anti-money laundering by targeting account transaction networks. By uploading transaction datasets, AnomalyGPT will detect anomalous accounts and visualize the entire account transaction network.

## Setup

1. Environment（Linux）

   ```
   git clone https://github.com/zhangzg1/AnomalyGPT.git
   conda create -n anomalygpt python=3.9
   conda activate anomalygpt
   pip install -r requirements.txt 
   ```

2. Backend

   ```
   cd backend
   python api_core.py
   ```

3. Frontend

   ```
   cd frontend
   npm install
   npm run start
   ```
