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

hours = {}

def getHour(datetime):
    #Input Format: '2015-xx-xx xx:xx:xx'
    #Returns the same format but rounded down to the hour
    return datetime.split(":")[0] + ":00:00"

#Change this to vary the size of the "block." size=1 is approx. 1 sq. block (slightly larger)
size = 5

def getBlock(lat, lng):
    #Takes a lat and a long, as string objects, and rounds to return the block as described above
    return str(round(round(float(lat)/size, 3)*size, 3))+" "+str(round(round(float(lng)/size, 3)*size,3))

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
    exportfile = "../hour_jsons/"+month+"_hours.json"

    #Empty the data from the previous month
    hours.clear()

    for ride in csv:
        count += 1
        print(count) #To track progress instead of staring at a blank screen

        #Filter out invalid data
        if(float(ride[pickup_lat]) == 0 or float(ride[pickup_long]) == 0 or float(ride[total]) <= 0):
            continue

        hour = getHour(ride[pickup_time])
        if not(hour in hours): #Create new hour
            hours[hour] = {}

        block = getBlock(ride[pickup_lat], ride[pickup_long])

        if not(block in hours[hour]): #Create new time
            hours[hour][block] = {}
            hhb = hours[hour][block]
            hhb["rides"] = 1
            hhb["passengers"] = int(ride[passengers])
            hhb["revenue"] = float(ride[total])
            hhb["distance"] = float(ride[distance])
            hhb["tips"] = float(ride[tip])
            #hhb["destinations"] = [getBlock(ride[dropoff_lat], ride[dropoff_long])]
            if ride[payment_type] == "1":
                hhb["tip_rides"] = 1
            else:
                hhb["tip_rides"] = 0
            
        else: #Update existing information
            hhb = hours[hour][block]
            hhb["rides"] += 1
            hhb["passengers"] += int(ride[passengers])
            hhb["revenue"] += float(ride[total])
            hhb["distance"] += float(ride[distance])
            hhb["tips"] += float(ride[tip])
            #hhb["destinations"] += [getBlock(ride[dropoff_lat], ride[dropoff_long])]
            if ride[payment_type] == "1":
                hhb["tip_rides"] += 1

    #After sorting all of the rides, we want to create averages for each hour/block; these are the functional pieces of the JSON that make up the visualization
    for hour in hours:
        hh = hours[hour]
        for block in hh:
            hhb = hh[block]
            total_rides = hhb["rides"]
            hhb["avg_passengers"] = round(hhb["passengers"]/total_rides, 2)
            hhb["avg_revenue"] = round(hhb["revenue"]/total_rides, 2)
            hhb["avg_distance"] = round(hhb["distance"]/total_rides, 2)
            if hhb["tip_rides"] == 0:
                hhb["avg_tips"] = "Insufficient data"
            else:
                hhb["avg_tips"] = round(hhb["tips"]/hhb["tip_rides"], 2)

            hhb["revenue"] = round(hhb["revenue"], 2)
            hhb["distance"] = round(hhb["distance"], 2)
            hhb["tips"] = round(hhb["tips"], 2)

    with open(exportfile, 'w') as w:
        json.dump(hours, w)
        
    

