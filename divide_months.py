import json
import requests
import math
import csv
import datetime

#Format of CSV
"""
['VendorID', 'tpep_pickup_datetime', 'tpep_dropoff_datetime', 'passenger_count', 'trip_distance', 'pickup_longitude', 'pickup_latitude', 'RateCodeID', 'store_and_fwd_flag', 'dropoff_longitude', 'dropoff_latitude', 'payment_type', 'fare_amount', 'extra', 'mta_tax', 'tip_amount', 'tolls_amount', 'total_amount']
"""

#In this script, the raw data CSV will be pared down and separated into individual months.
#This reduces the computation load for analyzing the CSVs, which my machine can't do on the full dataset.

#"Blocks" are denoted by unique latitude and longitude when rounded to 3 decimal places each
#(These are not actual city blocks, but areas approximately sized to one square block)
#For aggregation, times will be rounded down to the hour
#Tips will only be averaged in if payment_type = 1 (credit card; cash payments don't register tips)
#Invalid lat/longs will not be counted

#The current dataset only runs from January through June, but this script should work if a full-year dataset gets plugged in instead

order = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"]

def getMonth(datetime):
    #Format: 2015-xx-xx xx:xx:xx
    #Returns the number month of the time given
    return int(datetime.split("-")[1])

# open the csv
raw_data = csv.reader(open('../yellow_tripdata_2015-01-06.csv', 'r'), delimiter = ",")
# skip the header
next(raw_data, None)

#Variables for the indices of the csv, for readability of code. These are the indices we want in the sorted csvs.
pickup_time = 1
dropoff_time = 2
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

files = []
for month in order:
    newfile = open("../month_csvs/"+month+"_rides.csv", "w", newline = '')
    files.append(newfile)

writers = []

for f in files:
    writer = csv.writer(f, delimiter = "|")
    writer.writerow(['pickup_datetime', 'dropoff_time', 'passenger_count', 'trip_distance', 'pickup_longitude', 'pickup_latitude', 'dropoff_longitude', 'dropoff_latitude', 'payment_type', 'tip_amount', 'total_amount'])
    writers.append(writer)

for ride in raw_data:
    count += 1
    print(count) #To track progress instead of staring at a blank screen

    month = getMonth(ride[pickup_time])

    writers[month-1].writerow([ride[pickup_time], ride[dropoff_time], ride[passengers], ride[distance], ride[pickup_long], ride[pickup_lat], ride[dropoff_long], ride[dropoff_lat], ride[payment_type], ride[tip], ride[total]])
        
            

