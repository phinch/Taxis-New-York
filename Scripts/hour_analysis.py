import json
import math
import operator
import collections
import csv

all_hours = {}
with open("../Rankings/Top_25.json", 'r') as data:
    all_hours = json.load(data)

"""
JSON Format:
{
    hour:{
        "40.xxx -73.xxx": {
            avg_passengers: float,
            total_passengers: int,
            destinations: {block: int, block: int, ...},
            avg_tip: float,
            avg_distance: float,
            total_distance: float,
            total_tip: float,
            ride_count: int,
            avg_revenue: float,
            total_revenue: float
        }, ... X25
    }, ... X168
}
"""

reader = csv.reader(open('../rankings/avg_revenue_rank_5.csv', 'r'))
next(reader, None)

block_dict = {}
rank = 1
for block in reader:
    block_dict[block[0]] = rank
    rank += 1


#Now that we have our top 25 blocks, we want to more deeply analyze these blocks by finding their best hours.

#We'll give each hour a score based on the number of rides that hour, avg. revenue of rides that hour, and how likely those rides are to go to highly ranked blocks.

#First, we want aggregate data about total number of rides across hours, etc.
total_rides = 0
total_avg_revenue = 0
for hour in all_hours:
    this_hour = all_hours[hour]
    for block in this_hour:
        total_rides += this_hour[block]['ride_count']
        total_avg_revenue += this_hour[block]['avg_revenue']

hour_scores = []
for hour in all_hours:
    scores = []
    this_hour = all_hours[hour]
    for block in this_hour:
        score = 0
        this_block = this_hour[block]
        for dest in this_block['destinations']:
            if dest in block_dict:
                score += block_dict[dest]*this_block['destinations'][dest]

        score = score*(this_block['ride_count']/total_rides)*(this_block['avg_revenue']/total_avg_revenue)
        scores.append(score)

    hour_scores.append(((int(hour)-1), sum(scores)))

hour_scores.sort(key=lambda d:int(d[0]))

#Find the most profitable 12-hour period in each day (with possible overlap into the next day)
shift_info = []
for i in range(0, 7):
    start = i*24
    end = (i+1)*24

    change = 0
    best_start = start
    for j in range(start, end-12):
        change += (hour_scores[j+12][1] - hour_scores[j][1])
        if(change > 0):
            change = 0
            best_start = j+1

    best_end = best_start+11

    score = 0
    for j in range(best_start, best_end+1):
        score += hour_scores[j][1]

    shift_info.append((i, best_start%24, best_end%24, score))

#We now consider if we should lend hours from one day to another
for i in range(0, 7):
    start = i*24
    end = (i+1)*24
    
    today = shift_info[i]
    yesterday = shift_info[(i+6)%7]
    tomorrow = shift_info[(i+1)%7]

    today_start = today[1]+i*24
    today_end = today[2]+i*24

    yesterday_start = yesterday[1]+((i+6)%7)*24
    yesterday_end = yesterday[2]+((i+6)%7)*24

    tomorrow_start = tomorrow[1]+((i+1)%7)*24
    tomorrow_end = tomorrow[2]+((i+1)%7)*24
    #Consider giving hours to yesterday
    if today_start > 0:
        lend = True
        curr_hour = start
        while lend:
            score = hour_scores[curr_hour][1]
            #To lend, the hour needs to be more valuable than the start or end of our current shift (we're not accepting broken shifts)
            if score > hour_scores[today_start][1] or score > hour_scores[today_end][1]:
                #To lend, the hour also needs to be worth changing yesterday's shift to go through into the next day
                change = 0
                for j in range(yesterday_end+1, curr_hour+1):
                    change += (hour_scores[j][1] - hour_scores[j-12][1])

                if change > 0: #It's worth lending
                    #Determine new shift and score for today
                    if hour_scores[today_start][1] <= hour_scores[today_end][1]:
                        today_start += 1
                        new_score = shift_info[i][3] - hour_scores[today_start][1]
                    else:
                        today_end -= 1
                        new_score = shift_info[i][3] - hour_scores[today_end][1]
                        
                    shift_info[i] = (today[0], today_start%24, today_end%24, new_score)
                    #Determine new shift and score for yesterday
                    new_end = curr_hour
                    new_start = curr_hour-11
                    new_score = yesterday[3] + change
                    shift_info[(i+6)%7] = (yesterday[0], new_start%24, new_end%24, new_score)

                    #Update the hour and find out if it's worth lending again
                    curr_hour += 1
                else:
                    lend = False
            else:
                lend = False

    #Consider lending to the next day
    if today_end < 23:
        lend = True
        curr_hour = end
        while lend:
            score = hour_scores[curr_hour][1]
            #To lend, the hour needs to be more valuable than the start or end of our current shift (we're not accepting broken shifts)
            if score > hour_scores[today_start][1] or score > hour_scores[today_end][1]:
                #To lend, the hour also needs to be worth changing tomorrow's shift to go back into today
                change = 0
                for j in range(tomorrow_start-1, curr_hour-1, -1):
                    change += (hour_scores[j][1] - hour_scores[j+12][1])

                if change > 0: #It's worth lending
                    #Determine new shift and score for today
                    if hour_scores[today_start][1] <= hour_scores[today_end][1]:
                        today_start += 1
                        new_score = shift_info[i][3] - hour_scores[today_start][1]
                    else:
                        today_end -= 1
                        new_score = shift_info[i][3] - hour_scores[today_end][1]
                        
                    shift_info[i] = (today[0], today_start%24, today_end%24, new_score)
                    #Determine new shift and score for tomorrow
                    new_start = curr_hour
                    new_end = curr_hour+11
                    new_score = tomorrow[3] + change
                    shift_info[(i+1)%7] = (tomorrow[0], new_start%24, new_end%24, new_score)

                    #Update the hour and find out if it's worth lending again
                    curr_hour -= 1
                else:
                    lend = False
            else:
                lend = False

with open("../Rankings/shift_recs.csv", 'w', newline = '') as recs:
    writer = csv.writer(recs)
    writer.writerow(["Day", "Start", "End", "Score"])
    for i in range(0, 7):
        shift = shift_info[i]
        writer.writerow([shift[0], shift[1], shift[2]+1, shift[3]])

for i in range(0, 7):
    start = i*24
    end = (i+1)*24
    hour_scores[start:end] = sorted(hour_scores[start:end], key=lambda d:float(d[1]))

with open("../Rankings/hour_ranks.csv", 'w', newline = '') as output:
    writer = csv.writer(output)
    writer.writerow(["Hour", "Score"])
    count = 0
    for hour in hour_scores:
        writer.writerow([hour[0]%24, hour[1]])
        if count == 23:
            count = 0
            writer.writerow(["------------------------------"])
        else:
            count += 1
