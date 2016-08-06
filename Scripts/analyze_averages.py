import json
import requests
import math
import csv
import datetime
from astropy import stats
import numpy

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
rides = [];

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
            rides.append(float(block["rides"]))

    date += datetime.timedelta(days=1)

with open("../statistics.csv", "w") as f:
    writer = csv.writer(f)
    writer.writerow(["Statistic", "Revenue", "Tips", "Distance", "Passengers", "Avg Revenue", "Avg Tips", "Avg Distance", "Avg Passengers", "Rides"])
    writer.writerow(["Median", numpy.median(rev_list), numpy.median(tip_list), numpy.median(dist_list), numpy.median(pass_list), numpy.median(avg_revs), numpy.median(avg_tips), numpy.median(avg_dists), numpy.median(avg_pass), numpy.median(rides)])
    writer.writerow(["Mean", numpy.mean(rev_list), numpy.mean(tip_list), numpy.mean(dist_list), numpy.mean(pass_list), numpy.mean(avg_revs), numpy.mean(avg_tips), numpy.mean(avg_dists), numpy.mean(avg_pass), numpy.mean(rides)])
    writer.writerow(["Median Absolute Deviation", stats.mad_std(rev_list), stats.mad_std(tip_list), stats.mad_std(dist_list), stats.mad_std(pass_list), stats.mad_std(avg_revs), stats.mad_std(avg_tips), stats.mad_std(avg_dists), stats.mad_std(avg_pass), stats.mad_std(rides)])
    writer.writerow(["Standard Deviation", numpy.std(rev_list), numpy.std(tip_list), numpy.std(dist_list), numpy.std(pass_list), numpy.std(avg_revs), numpy.std(avg_tips), numpy.std(avg_dists), numpy.std(avg_pass), numpy.std(rides)])

