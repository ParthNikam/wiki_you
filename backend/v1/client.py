import requests

url = "http://127.0.0.1:8000/items"
data = {"name": "apple", "price": 10.5}

res = requests.post(url, json=data)
print(res.json())