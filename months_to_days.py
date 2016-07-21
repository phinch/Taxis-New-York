import json
import requests
import math
import csv
import datetime

#Format of CSV
"""
pickup_datetime|dropoff_time|passenger_count|trip_distance|pickup_longitude|pickup_latitude|dropoff_longitude|dropoff_latitude|payment_type|tip_amount|total_amount
"""

#Initial testing of the visualization shows that loading JSONs for the entire month is extremely prohibitive.
#To accommodate this, month JSONs are here split into individual days, such that each of 365 JSONs will now have 24 inner JSONs.

order = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"]
currorder = -1

today = {}

date = datetime.date(2015, 1, 1)

#Iterate through the days of the year
while date.year < 2016:
    today = {}
    newfile = "../day_jsons/"+date.isoformat()+".json"

    month = date.month - 1
    if month != currorder:
        currorder = month
        openfile = json.load(open('../month_jsons/'+order[currorder]+'_hours.json', 'r'))

    hour = datetime.datetime(date.year, date.month, date.day, 0, 0, 0)

    #Iterate through the hours of one day
    while hour.day == date.day: 
        index = hour.isoformat(" ").split(".")[0]
        hour += datetime.timedelta(hours=1)
        if not index in openfile:
            continue
        today[index] = openfile[index]


    with open(newfile, 'w') as w:
        json.dump(today, w)

    date += datetime.timedelta(days=1)

