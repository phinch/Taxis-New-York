import json
import requests
import math
import csv
import datetime

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

baseurl = "https://data.cityofnewyork.us/resource/2yzn-sicd.json?$$app_token=cU8jotGqWfexWUODoB0zXA1Yl&$limit=1000000"

#Dict of dicts
blocks = {}
periods = {}

#Each block contains the information from 365 days, with 3 times of day per day
#Information includes the following information per subsection:
"""
    number of rides
    total revenue
    total mass
    (total distance)
    (total tips)
    list of destination blocks
    avg. total fare
    avg. passengers
    avg. tip
    avg. distance
"""

#Blocks are denoted by unique latitude and longitude when rounded to 3 decimal places each
#(These are not actual city blocks, but areas approximately sized to one square block)
#Times of day: Morning, 4am-12pm; Afternoon, 12pm-8pm; Evening, 8pm-4am
#Tips will only be averaged in if payment_type = 1
#Invalid lat/longs will not be counted

#The script runs from 8pm of December 31, 2014, to 4am of January 1, 2016
#(As such, data is slightly truncated on each end, but given the significance of New Year's Eve in New York, I included this data nonetheless)

start = datetime.datetime(2014,12,31,20,0,0)
end = datetime.datetime(2015,1,1,4,0,0)

#Change this to vary the size of the "block." size=1 is approx. 1 sq. block
size = 1

for i in range(-1, 365*3): #365*3

    isostart = start.isoformat()
    isoend = end.isoformat()
    
    data = requests.get(baseurl+"&$where=pickup_datetime%20between%20%27"+isostart+"%27%20and%20%27"+isoend+"%27").json()

    periods[isostart] = 0

    timed_blocks = []
    #Aggregate the data by block
    for ride in data:
        if(float(ride["pickup_latitude"]) == 0 or float(ride["pickup_longitude"]) == 0):
            continue
        block = str(round(float(ride["pickup_latitude"])/size, 3)*size)+" "+str(round(float(ride["pickup_longitude"])/size, 3)*size)
        if not(block in blocks): #Create new block and time
            blocks[block] = {}
            timed_blocks += [block]

        periods[isostart] += 1

        if not(isostart in blocks[block]): #Create new time
            blocks[block][isostart] = {}
            bbs = blocks[block][isostart]
            bbs["rides"] = 1
            bbs["passengers"] = int(ride["passenger_count"])
            bbs["revenue"] = float(ride["total_amount"])
            bbs["distance"] = float(ride["trip_distance"])
            bbs["tips"] = float(ride["tip_amount"])
            bbs["destinations"] = [(round(float(ride["dropoff_latitude"])/size, 3)*size, round(float(ride["dropoff_longitude"])/size, 3)*size)]
            if ride["payment_type"] == "1":
                bbs["tip_rides"] = 1
            else:
                bbs["tip_rides"] = 0
        else: #Update information
            bbs = blocks[block][isostart]
            bbs["rides"] += 1
            bbs["passengers"] += int(ride["passenger_count"])
            bbs["revenue"] += float(ride["total_amount"])
            bbs["distance"] += float(ride["trip_distance"])
            bbs["tips"] += float(ride["tip_amount"])
            bbs["destinations"] += [(round(float(ride["dropoff_latitude"])/size, 3)*size, round(float(ride["dropoff_longitude"])/size, 3)*size)]
            if ride["payment_type"] == "1":
                bbs["tip_rides"] += 1

    #Create averages and round for all of the blocks
    for block in timed_blocks:
        bbs = blocks[block][isostart]
        total_rides = bbs["rides"]
        bbs["avg_passengers"] = round(bbs["passengers"]/total_rides, 2)
        bbs["avg_revenue"] = round(bbs["revenue"]/total_rides, 2)
        bbs["avg_distance"] = round(bbs["distance"]/total_rides, 2)
        if bbs["tip_rides"] == 0:
            bbs["avg_tips"] = "Insufficient data"
        else:
            bbs["avg_tips"] = round(bbs["tips"]/bbs["tip_rides"], 2)

        bbs["revenue"] = round(bbs["revenue"], 2)
        bbs["distance"] = round(bbs["distance"], 2)
        bbs["tips"] = round(bbs["tips"], 2)
            

    #Update the times to the next period
    if i%3 == 0:
        start += datetime.timedelta(hours=8)
        end += datetime.timedelta(hours=8)
    elif i%3 == 1:
        start += datetime.timedelta(hours=8)
        end += datetime.timedelta(days=1,hours=-16)
    elif i%3 == 2:
        start += datetime.timedelta(days=1,hours=-16)
        end += datetime.timedelta(hours=8)

with open("block_data.json", "w") as f:
    json.dump(blocks, f)

with open("time_data.json", "w") as p:
    json.dump(periods, p)

"""
for block in blocks:
    for time in blocks[block]:
        for item in blocks[block][time]:
            print(item, blocks[block][time][item])

    break

for period in periods:
    print(period, periods[period])
"""
        
    

