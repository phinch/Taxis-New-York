import json
import requests
import math
import csv
import datetime

#Format of raw_data CSV
"""
['VendorID', 'tpep_pickup_datetime', 'tpep_dropoff_datetime', 'passenger_count', 'trip_distance', 'pickup_longitude', 'pickup_latitude', 'RateCodeID', 'store_and_fwd_flag', 'dropoff_longitude', 'dropoff_latitude', 'payment_type', 'fare_amount', 'extra', 'mta_tax', 'tip_amount', 'tolls_amount', 'total_amount']
"""

#This script produces a more in-depth analysis of the top 25 blocks, as produced by block_rank (v5).
#On all blocks, we collected data in aggregate across times; with these 25 blocks, we'll produce data split across the 168 hours of the week.

reader = csv.reader(open('../rankings/Top_25.csv', 'r'))
next(reader, None)

block_set = set()
for block in reader:
    block_set.add(block[0])

#Change this to vary the size of the "block." size=1 is approx. 1 sq. block (slightly larger)
size = 5

def getBlock(lat, lng):
    #Takes a lat and a long, as string objects, and rounds to return the block as described above
    return str(round(round(float(lat)/size, 3)*size, 3))+" "+str(round(round(float(lng)/size, 3)*size, 3))

def getHour(fulltime):
    #Input Format: '2015-01-08 22:44:12'
    #Returns integer in range 1-168
    year = int(fulltime.split("-")[0])
    month = int(fulltime.split("-")[1])
    date = int(fulltime.split("-")[2].split(" ")[0])
    hour  = int(fulltime.split(" ")[1].split(":")[0])

    mytime = datetime.date(year, month, date)
    return 24*mytime.weekday() + (hour+1)

info_by_hour = {}
    
raw_data = csv.reader(open('../../yellow_tripdata_2015-01-06.csv', 'r'), delimiter = ",")
next(raw_data, None)

#Variables for the indices of the csv, for readability of code. These are the indices we want in the sorted csvs.
pickup_time = 1
passengers = 3
distance = 4
pickup_long = 5
pickup_lat = 6
dropoff_long = 9
dropoff_lat = 10
payment_type = 11
tip = 15
total = 17

count = 0
for ride in raw_data:
    count += 1
    print(count)

    if(float(ride[pickup_lat]) == 0 or float(ride[pickup_long]) == 0 or float(ride[total]) <= 0 or float(ride[dropoff_lat]) == 0 or float(ride[dropoff_long]) == 0):
        continue

    block = getBlock(ride[pickup_lat], ride[pickup_long])
    toblock = getBlock(ride[dropoff_lat], ride[dropoff_long])

    if not block in block_set:
        continue

    hour = getHour(ride[pickup_time])

    if not hour in info_by_hour:
        info_by_hour[hour] = {}

    this_hour = info_by_hour[hour]

    if block in this_hour:
        this_hour[block]['ride_count'] += 1
        this_hour[block]['total_revenue'] += float(ride[total])
        this_hour[block]['total_tip'] += float(ride[tip])
        this_hour[block]['total_distance'] += float(ride[distance])
        this_hour[block]['total_passengers'] += int(ride[passengers])
        if ride[payment_type] == "1":
            this_hour[block]['tip_rides'] += 1
        if toblock in this_hour[block]['destinations']:
            this_hour[block]['destinations'][toblock] += 1
        else:
            this_hour[block]['destinations'][toblock] = 1
    else:
        this_hour[block] = {}
        this_hour[block]['ride_count'] = 1
        this_hour[block]['total_revenue'] = float(ride[total])
        this_hour[block]['total_tip'] = float(ride[tip])
        this_hour[block]['total_distance'] = float(ride[distance])
        this_hour[block]['total_passengers'] = int(ride[passengers])
        this_hour[block]['tip_rides'] = 0
        if ride[payment_type] == "1":
            this_hour[block]['tip_rides'] = 1
        this_hour[block]['destinations'] = {}
        this_hour[block]['destinations'][toblock] = 1
   
for h in info_by_hour:
    hour = info_by_hour[h] 
    for b in hour:
        block = hour[b]
        #averages: revenue, tip, distance, passengers
        block['avg_revenue'] = round(block['total_revenue']/block['ride_count'], 2)
        if block['tip_rides'] > 0:
            block['avg_tip'] = round(block['total_tip']/block['tip_rides'], 2)
        else:
            block['avg_tip'] = "N/A"
        block['avg_distance'] = round(block['total_distance']/block['ride_count'], 2)
        block['avg_passengers'] = round(block['total_passengers']/block['ride_count'], 2)
        block['total_revenue'] = round(block['total_revenue'], 2)
        block['total_tip'] = round(block['total_tip'], 2)
        block['total_distance'] = round(block['total_distance'], 2)

with open("../rankings/Top_25.json", 'w') as output:
    json.dump(info_by_hour, output)
