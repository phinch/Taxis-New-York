import json
import math
import operator
import collections
import csv

all_blocks = {}
with open("all_blocks.json", 'r') as data:
    all_blocks = json.load(data)

"""
JSON Format:
{
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
    }, ...
}
"""

#This algorithm is an initial attempt at exploring blocks by their level of appeal.
#At the outset, this means just sorting them by average or total revenue, but this obviously doesn't tell the whole story.
#Another important dimension is an appealing destination; I want a block where I'm likely to travel to another appealing block, to continue the cycle
#We will iteratively sort the blocks by appeal until we reach some level of convergence, i.e. a consistent ordering of blocks. 

#First, we want to sort the blocks into a list; we'll make 2 lists, one for average and one for total revenue.
#For fun, we'll also make a sort based on the total number of rides. 
#In the first iteration, this makes the most sense in terms of appeal, because outliers dominate revenue.
block_list = []
block_dict = {}

total_average_revenue = 0

for block in all_blocks:
    total_average_revenue += all_blocks[block]['avg_revenue']
    block_list += [(block, all_blocks[block])]

size = len(block_list)

avg_order = sorted(block_list, key=lambda d: d[1]['avg_revenue'])
total_order = sorted(block_list, key=lambda d: d[1]['total_revenue'])
ride_order = sorted(block_list, key=lambda d: d[1]['ride_count'])

#We'll run the ranking algorithm based on avg_order first.
#The general path of the algorithm:
#For each block:
#   score = 0
#   For each destination:
#       score += destination_frequency * destination_score (where score = 1-index in the list)
#   Store total score
#Order the blocks based on new scores
#Find number of changes between the previous ordering and this ordering
#If within a certain threshhold:
#   break
#Else:
#   repeat

#We can stop once the list stops changing its order; we might have some threshhold above 0 to account for very close scores
convergence = 0.001

old_blocks = []
new_scores = []
new_blocks = []

for item in avg_order:
    old_blocks.append(item[0])

converged = False

iter_count = 0
while not converged:
    block_dict = {}
    iter_count += 1

    rank = 1
    for block in old_blocks:
        block_dict[block] = rank
        rank += 1

    for block in block_list:

        destinations = block[1]['destinations']
        rides = block[1]['ride_count']
        score = 0
        for dest in destinations:
            try:
                score += destinations[dest]*(all_blocks[dest]['avg_revenue']/total_average_revenue)*(block_dict[dest]/size)
            except KeyError: #Not all pickup blocks are destinations; these cases are discounted as completely unappealing
                continue
        
        score *= block_dict[block[0]]/size
        new_scores.append((block[0], score))
    
    new_scores.sort(key=lambda d: d[1])
    
    for item in new_scores:
        new_blocks.append(item[0])

    differences = 0
    for i in range(0, len(new_blocks)):
        if(new_blocks[i] != old_blocks[i]):
            differences += 1        

    print(differences, iter_count)

    old_blocks = new_blocks
    new_blocks = []
    new_scores = []

    if differences <= 0 or iter_count > 500:
        break

#old_blocks now contains the final ordering, iterated to convergence

with open("avg_revenue_rank_5.csv", 'w', newline = '') as output:
    writer = csv.writer(output)
    writer.writerow(["Block"])
    for item in old_blocks:
        writer.writerow([item])
