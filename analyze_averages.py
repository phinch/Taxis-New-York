import json
import requests
import math
import csv
import datetime
import statistics

"""{
    "[BLOCK LAT LONG]":
    {
        "[Hour of Year]":
        {
            avg_distance:9.31
            avg_passengers:1
            avg_revenue:5.33
            avg_tips:"Insufficient data"
            distance:9.31
            passengers:1
            revenue:5.33
            rides:1
            tip_rides:0
            tips:0
        }
    }
}"""

#The visualization relies on coloring circles based on where they fit in the distribution of rides.
#This script will get means, ranges, and variances for the dataset.

order = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"]
currorder = -1

today = {}

date = datetime.date(2015, 1, 1)

#Iterate through the days of the year
avg_revs = [];
rev_list = [];
avg_tips = [];
tip_list = [];
avg_dists = [];
dist_list = [];
avg_pass = [];
pass_list = [];

while date.year < 2016:
    today = {}

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
        for b in openfile[index]:
            block = openfile[index][b]
            avg_revs.append(float(block["avg_revenue"]))
            if block["avg_tips"] != "Insufficient data":
                avg_tips.append(float(block["avg_tips"]))
            avg_dists.append(float(block["avg_distance"]))
            avg_pass.append(float(block["avg_passengers"]))
            dist_list.append(float(block["distance"]))
            tip_list.append(float(block["tips"]))
            rev_list.append(float(block["revenue"]))
            pass_list.append(float(block["passengers"]))

    date += datetime.timedelta(days=1)

with open("../statistics.csv", "w") as f:
    writer = csv.writer(f)
    writer.writerow(["Statistic", "Revenue", "Tips", "Distance", "Passengers", "Avg Revenue", "Avg Tips", "Avg Distance", "Avg Passengers"])
    writer.writerow(["Mean", statistics.mean(rev_list), statistics.mean(tip_list), statistics.mean(dist_list), statistics.mean(pass_list), statistics.mean(avg_revs), statistics.mean(avg_tips), statistics.mean(avg_dists), statistics.mean(avg_pass)])
    writer.writerow(["Median", statistics.median(rev_list), statistics.median(tip_list), statistics.median(dist_list), statistics.median(pass_list), statistics.median(avg_revs), statistics.median(avg_tips), statistics.median(avg_dists), statistics.median(avg_pass)])
    writer.writerow(["Standard Deviation", statistics.stdev(rev_list), statistics.stdev(tip_list), statistics.stdev(dist_list), statistics.stdev(pass_list), statistics.stdev(avg_revs), statistics.stdev(avg_tips), statistics.stdev(avg_dists), statistics.stdev(avg_pass)])
