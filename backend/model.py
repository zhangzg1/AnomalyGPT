from fastapi import APIRouter
from utils import request
from prompt import *

router = APIRouter(prefix="/anomaly")


@router.get('/get_graph')
async def get_graph(text: str, api_key: str):
    init_prompt = init.replace("$text", text)
    text_graph = (await request(init_prompt, api_key))['choices'][0]['message']['content']
    return text_graph


@router.get('/gad')
async def graph_anomaly_detection(text: str, api_key: str):
    init_prompt = init.replace("$text", text)
    graph_data = (await request(init_prompt, api_key))['choices'][0]['message']['content']
    anomaly_list_prompt = anomaly_list.replace("$graph_data", graph_data)
    node_list = (await request(anomaly_list_prompt, api_key))['choices'][0]['message']['content']
    anomaly_set_prompt = anomaly_set.replace("$graph_data", graph_data).replace("$node_list", node_list)
    node_set = (await request(anomaly_set_prompt, api_key))['choices'][0]['message']['content']
    update_kg_prompt = update_kg.replace("$graph_data", graph_data).replace("$node_set", node_set)
    anomaly_output = (await request(update_kg_prompt, api_key))['choices'][0]['message']['content']
    return anomaly_output


@router.get('/aml_show')
async def aml_graph_show(data: str, api_key: str):
    excel_get_prompt = excel_get.replace("$excel_data", data)
    excel_graph = (await request(excel_get_prompt, api_key))['choices'][0]['message']['content']
    return excel_graph


@router.get('/aml_gad')
async def aml_graph_gad(data: str, api_key: str):
    excel_get_prompt = excel_get.replace("$excel_data", data)
    transaction_graph = (await request(excel_get_prompt, api_key))['choices'][0]['message']['content']
    account_list_prompt = account_list.replace("$transaction_graph", transaction_graph)
    account_graph_list = (await request(account_list_prompt, api_key))['choices'][0]['message']['content']
    account_set_prompt = account_set.replace("$transaction_graph", transaction_graph).replace("$account_graph_list", account_graph_list)
    account_graph_set = (await request(account_set_prompt, api_key))['choices'][0]['message']['content']
    update_account_prompt = update_account.replace("$transaction_graph", transaction_graph).replace("$account_graph_set", account_graph_set)
    anomaly_account = (await request(update_account_prompt, api_key))['choices'][0]['message']['content']
    return anomaly_account
