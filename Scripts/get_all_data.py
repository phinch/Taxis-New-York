import json
import requests

data = requests.get("https://data.cityofnewyork.us/resource/2yzn-sicd.json?$$app_token=cU8jotGqWfexWUODoB0zXA1Yl&$limit=10000").json()

with open("raw_data.json", "w") as f:
    offset = len(data)
    count = 0
    while len(data) > 0 and count < 40000:
        json.dump(data, f)
        data = requests.get("https://data.cityofnewyork.us/resource/2yzn-sicd.json?$$app_token=cU8jotGqWfexWUODoB0zXA1Yl&$limit=10000&$offset="+str(offset)).json()
        offset += len(data)
        count += 1
