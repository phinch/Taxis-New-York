import json
import requests
import math
import csv
import datetime

#Format of CSV
"""
['VendorID', 'tpep_pickup_datetime', 'tpep_dropoff_datetime', 'passenger_count', 'trip_distance', 'pickup_longitude', 'pickup_latitude', 'RateCodeID', 'store_and_fwd_flag', 'dropoff_longitude', 'dropoff_latitude', 'payment_type', 'fare_amount', 'extra', 'mta_tax', 'tip_amount', 'tolls_amount', 'total_amount']
"""

#In this script, the raw data CSV will be divided into "blocks," with all data being aggregated without respect to time

#This data includes total revenue, total tip, total rides, total passengers, total distance; averages of all of these; and a JSON object tracking destinations

# open the csv
raw_data = csv.reader(open('../yellow_tripdata_2015-01-06.csv', 'r'), delimiter = ",")
# skip the header
next(raw_data, None)

#Variables for the indices of the csv, for readability of code. These are the indices we want in the sorted csvs.
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

all_blocks = {}

#Change this to vary the size of the "block." size=1 is approx. 1 sq. block
size = 5

def getBlock(lat, lng):
    #Takes a lat and a long, as string objects, and rounds to return the block as described above
    return str(round(round(float(lat)/size, 3)*size, 3))+" "+str(round(round(float(lng)/size, 3)*size, 3))

for ride in raw_data:
    count += 1
    print(count) #To track progress instead of staring at a blank screen

    if(float(ride[pickup_lat]) == 0 or float(ride[pickup_long]) == 0 or float(ride[total]) <= 0 or float(ride[dropoff_lat]) == 0 or float(ride[dropoff_long]) == 0):
        continue

    block = getBlock(ride[pickup_lat], ride[pickup_long])
    toblock = getBlock(ride[dropoff_lat], ride[dropoff_long])
    
    #ride_count, total_revenue, total_tip, total_distance, total_passengers, tip_rides, destinations
    if block in all_blocks:
        all_blocks[block]['ride_count'] += 1
        all_blocks[block]['total_revenue'] += float(ride[total])
        all_blocks[block]['total_tip'] += float(ride[tip])
        all_blocks[block]['total_distance'] += float(ride[distance])
        all_blocks[block]['total_passengers'] += int(ride[passengers])
        if ride[payment_type] == "1":
            all_blocks[block]['tip_rides'] += 1
        if toblock in all_blocks[block]['destinations']:
            all_blocks[block]['destinations'][toblock] += 1
        else:
            all_blocks[block]['destinations'][toblock] = 1
    else:
        all_blocks[block] = {}
        all_blocks[block]['ride_count'] = 1
        all_blocks[block]['total_revenue'] = float(ride[total])
        all_blocks[block]['total_tip'] = float(ride[tip])
        all_blocks[block]['total_distance'] = float(ride[distance])
        all_blocks[block]['total_passengers'] = int(ride[passengers])
        all_blocks[block]['tip_rides'] = 0
        if ride[payment_type] == "1":
            all_blocks[block]['tip_rides'] = 1
        all_blocks[block]['destinations'] = {}
        all_blocks[block]['destinations'][toblock] = 1
    
for b in all_blocks:
    block = all_blocks[b]
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

with open("all_blocks.json", 'w') as output:
    json.dump(all_blocks, output)
        
            

