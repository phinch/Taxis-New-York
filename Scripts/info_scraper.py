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

data = requests.get('https://data.cityofnewyork.us/resource/2yzn-sicd.json').json()

def getinfo(word, ride):
    fulltime = ride[word+'_datetime'].split("T")
    month = fulltime[0].split("-")[1]
    day = fulltime[0].split("-")[2]
    time = fulltime[1].split(".")[0]

    lat = ride[word+'_latitude']
    lng = ride[word+'_longitude']

    return [month, day, time, lat, lng]

with open("clean_rides.csv", "w", newline='') as r:
    rwriter = csv.writer(r, delimiter = "|")
    rwriter.writerow(["pickup_month", "pickup_day", "pickup_time", "pickup_lat", "pickup_long", "dropoff_month", "dropoff_day", "dropoff_time", "dropoff_lat", "dropoff_long", "passengers", "fare", "tip", "total", "distance"])

    for ride in data:
        passengers = ride['passenger_count']
        fare = ride['fare_amount']
        tip = ride['tip_amount']
        total = ride['total_amount']
        distance = ride['trip_distance']

        general_info = [passengers, fare, tip, total, distance]

        p_info = getinfo('pickup', ride)
        d_info = getinfo('dropoff', ride)
        
        rwriter.writerow(p_info+d_info+general_info)
    


