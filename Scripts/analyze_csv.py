import json
import requests
import math
import csv
import datetime

#Format of CSV
"""
pickup_datetime|dropoff_time|passenger_count|trip_distance|pickup_longitude|pickup_latitude|dropoff_longitude|dropoff_latitude|payment_type|tip_amount|total_amount
"""

#In this script, all of the taxi rides are sorted into the respective "blocks" and hours across the city and year. 
#The result is a nested JSON object that can be used in a geographic and chronological visualizaiton.

#As of now, the scripts are separated into files by month; as such, the resultant JSONs will also be split up by month. 

#"Blocks" are denoted by unique latitude and longitude when rounded to 3 decimal places each
#(These are not actual city blocks, but areas approximately sized to one square block)
#For aggregation, times will be rounded down to the hour
#Tips will only be averaged in if payment_type = 1 (credit card; cash payments don't register tips)
#Invalid lat/longs will not be counted

blocks = {}

def getHour(datetime):
    #Input Format: '2015-xx-xx xx:xx:xx'
    #Returns the same format but rounded down to the hour
    return datetime.split(":")[0] + ":00:00"

#Change this to vary the size of the "block." size=1 is approx. 1 sq. block (slightly larger)
size = 2

def getBlock(lat, lng):
    #Takes a lat and a long, as string objects, and rounds to return the block as described above
    return str(round(float(lat)/size, 3)*size)+" "+str(round(float(lng)/size, 3)*size)

order = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"]

months = []

for month in order:
    reader = csv.reader(open('../month_csvs/'+month+"_rides.csv", 'r'), delimiter = "|")
    #Skip the header
    next(reader, None)
    months.append(reader)

#Variables for the indices of the csv, for readability of code:
pickup_time = 0
dropoff_time = 1
passengers = 2
distance = 3
pickup_long = 4
pickup_lat = 5
dropoff_long = 6
dropoff_lat = 7
payment_type = 8
tip = 9
total = 10

count = 0

for i in range(0, len(months)):
    csv = months[i]
    month = order[i]
    exportfile = "../block_jsons/"+month+"_blocks.json"

    #Empty the data from the previous month
    blocks.clear()

    for ride in csv:
        count += 1
        print(count) #To track progress instead of staring at a blank screen

        #Filter out invalid data
        if(float(ride[pickup_lat]) == 0 or float(ride[pickup_long]) == 0 or float(ride[total]) <= 0):
            continue

        block = getBlock(ride[pickup_lat], ride[pickup_long])
        if not(block in blocks): #Create new block and time
            blocks[block] = {}

        hour = getHour(ride[pickup_time])

        if not(hour in blocks[block]): #Create new time
            blocks[block][hour] = {}
            bbh = blocks[block][hour]
            bbh["rides"] = 1
            bbh["passengers"] = int(ride[passengers])
            bbh["revenue"] = float(ride[total])
            bbh["distance"] = float(ride[distance])
            bbh["tips"] = float(ride[tip])
            #bbh["destinations"] = [getBlock(ride[dropoff_lat], ride[dropoff_long])]
            if ride[payment_type] == "1":
                bbh["tip_rides"] = 1
            else:
                bbh["tip_rides"] = 0
            
        else: #Update existing information
            bbh = blocks[block][hour]
            bbh["rides"] += 1
            bbh["passengers"] += int(ride[passengers])
            bbh["revenue"] += float(ride[total])
            bbh["distance"] += float(ride[distance])
            bbh["tips"] += float(ride[tip])
            #bbh["destinations"] += [getBlock(ride[dropoff_lat], ride[dropoff_long])]
            if ride[payment_type] == "1":
                bbh["tip_rides"] += 1

    #After sorting all of the rides, we want to create averages for each block/hour; these are the functional pieces of the JSON that make up the visualization
    for block in blocks:
        bb = blocks[block]
        for hour in bb:
            bbh = bb[hour]
            total_rides = bbh["rides"]
            bbh["avg_passengers"] = round(bbh["passengers"]/total_rides, 2)
            bbh["avg_revenue"] = round(bbh["revenue"]/total_rides, 2)
            bbh["avg_distance"] = round(bbh["distance"]/total_rides, 2)
            if bbh["tip_rides"] == 0:
                bbh["avg_tips"] = "Insufficient data"
            else:
                bbh["avg_tips"] = round(bbh["tips"]/bbh["tip_rides"], 2)

            bbh["revenue"] = round(bbh["revenue"], 2)
            bbh["distance"] = round(bbh["distance"], 2)
            bbh["tips"] = round(bbh["tips"], 2)

    with open(exportfile, 'w') as w:
        json.dump(blocks, w)
        
    

