import json
import requests

ChatGPT_PARAMS = {
    "model": "gpt-3.5-turbo",
    "temperature": 0.01,
    "max_tokens": 4096,
    "frequency_penalty": 0,
    "presence_penalty": 0
}


async def request(prompt: str, api_key: str):
    url = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + api_key
    }
    messages = [{"role": "user", "content": prompt}]
    payload = {
        "model": ChatGPT_PARAMS['model'],
        "messages": messages,
        "temperature": ChatGPT_PARAMS['temperature']
    }
    response = requests.post(url, headers=headers, data=json.dumps(payload))
    response.raise_for_status()
    return response.json()
