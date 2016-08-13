import json
import math
import operator
import collections
import csv

all_blocks = {}
with open("../all_blocks.json", 'r') as data:
    all_blocks = json.load(data)

with open("../rankings/graph_data.csv", 'w', newline = '') as output:
    writer = csv.writer(output)
    writer.writerow(["Block", "Average Revenue", "Total Revenue", "Ride Count"])
    for block in all_blocks:
        writer.writerow([block, all_blocks[block]['avg_revenue'], all_blocks[block]['total_revenue'], all_blocks[block]['ride_count']])
