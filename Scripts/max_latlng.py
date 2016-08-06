import json
import requests
import math
import csv

"""{
    "dropoff_datetime":"2015-01-06T18:17:33.000",
    "dropoff_latitude":"40.755485534667969",
    "dropoff_longitude":"-73.968955993652344",
    "extra":"1",
    "fare_amount":"29.5",
    "mta_tax":"0.5",
    "passenger_count":"1",
    "payment_type":"1",
    "pickup_datetime":"2015-01-06T17:59:51.000",
    "pickup_latitude":"40.770015716552734",
    "pickup_longitude":"-73.863929748535156",
    "rate_code":"1",
    "store_and_fwd_flag":"N",
    "tip_amount":"4.75",
    "tolls_amount":"5.33",
    "total_amount":"41.38",
    "trip_distance":"10.6",
    "vendor_id":"1"
}"""

data = requests.get("https://data.cityofnewyork.us/resource/2yzn-sicd.json?$$app_token=cU8jotGqWfexWUODoB0zXA1Yl&$limit=77080575&$select=dropoff_latitude, dropoff_longitude, pickup_latitude, pickup_longitude").json()
print("got data")
minlat = 100
maxlat = -1
minlng = 100
maxlng = -100

for ride in data:
    if float(ride["dropoff_latitude"]) != 0:
        minlat = min(minlat, float(ride["dropoff_latitude"]))
        maxlat = max(maxlat, float(ride["dropoff_latitude"]))

    if float(ride["dropoff_longitude"]) != 0:
        minlng = min(minlng, float(ride["dropoff_longitude"]))
        maxlng = max(maxlng, float(ride["dropoff_longitude"]))

    if float(ride["pickup_latitude"]) != 0:
        minlat = min(minlat, float(ride["pickup_latitude"]))
        maxlat = max(maxlat, float(ride["pickup_latitude"]))

    if float(ride["pickup_longitude"]) != 0:
        minlng = min(minlng, float(ride["pickup_longitude"]))
        maxlng = max(maxlng, float(ride["pickup_longitude"]))

print(minlat, maxlat, minlng, maxlng)
