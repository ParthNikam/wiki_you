import requests

url = "http://127.0.0.1:8000/query"
data = {"question": "What happened on sports day? who won?"}

res = requests.post(url, json=data)
print(res.json())