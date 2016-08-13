import json
import math
import operator
import collections
import csv

all_blocks = {}
with open("../all_blocks.json", 'r') as data:
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

block_list = []
block_dict = {}

total_average_revenue = 0

for block in all_blocks:
    block_dict[block] = all_blocks[block]

size = len(block_list)

avg_list = []

threshold = 260640

for ride in block_dict:
    if block_dict[ride]['ride_count'] >= threshold:
        avg_list.append((ride, block_dict[ride]))

avg_order = sorted(avg_list, key=lambda d: d[1]['avg_revenue'])

with open("../rankings/combined_metrics.csv", 'w', newline = '') as output:
    writer = csv.writer(output)
    writer.writerow(["Block"])
    for item in avg_order:
        writer.writerow([item[0]])





