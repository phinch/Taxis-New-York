var combined_metrics;
var block_rank;
$(document).on("ready", function(){
    d3.csv("rankings/graph_data.csv", function(error, rows){
        drawScatter("#arev_rides", 'Average Revenue', 'Ride Count', rows)
        drawScatter("#trev_rides", 'Total Revenue', 'Ride Count', rows)
        drawScatter("#arev_trev", 'Average Revenue', 'Total Revenue', rows)
    });

    d3.csv("rankings/combined_metrics.csv", function(error, blocks){
        drawMap(combined_metrics, blocks, 25);
    });

    d3.csv("rankings/Top_25.csv", function(error, blocks){
        drawMap(block_rank, blocks, 25);
    });
});

function initMap() {
    combined_metrics = new google.maps.Map(document.getElementById('combined_metrics'), {
        center: {lat: 40.7119, lng: -73.8773},
        zoom: 11,
        minZoom: 11,
        disableDefaultUI: true
    });
    block_rank = new google.maps.Map(document.getElementById('block_rank'), {
        center: {lat: 40.7119, lng: -73.8773},
        zoom: 11,
        minZoom: 11,
        disableDefaultUI: true
    });
}

function drawScatter(id, x, y, rows){
    var margin = {top: 20, right: 20, bottom: 100, left: 100},
        width = 450 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    var svg = d3.select(id).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var xscale = d3.scale.linear()
        .range([0, width]);

    var yscale = d3.scale.linear()
        .range([height, 0]);

    rows.forEach(function(d) {
        d[y] = +d[y];
        d[x] = +d[x];
    });

    var xAxis = d3.svg.axis()
        .scale(xscale)
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .scale(yscale)
        .orient("left");

    yscale.domain(d3.extent(rows, function(d) { return d[y]; })).nice();
    xscale.domain(d3.extent(rows, function(d) { return d[x]; })).nice();

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text(y);

    svg.selectAll(".dot")
        .data(rows)
        .enter().append("circle")
        .attr("class", "dot")
        .attr("r", 2)
        .attr("cx", function(d) { return xscale(d[x]); })
        .attr("cy", function(d) { return yscale(d[y]); })
        .style("fill", "none")
        .style("stroke", "#222222")
        .style("stroke-width", 1)

    svg.selectAll(".x.axis text")  // select all the text elements for the xaxis
        .attr("transform", function(d) {
            return "translate(" + this.getBBox().height*-2 + "," + (this.getBBox().height+15) + ")rotate(-45)";
        });

    svg.select(".x.axis")
        .append("text")
        .attr("y", -5)
        .attr("x", width)
        .style("text-anchor", "end")
        .text(x);
}

function drawMap(map, blocks, limit){
    var top = [];
    for(block in blocks){
        top.push(blocks[block])
        if(top.length > limit){
            top.shift();
        }       
    }
    for(block in top){
        center = top[block]['Block'].split(" ");
        center[0] = parseFloat(center[0]); center[1] = parseFloat(center[1])

        coords = []
        coords.push({lat: center[0]-0.0025, lng: center[1]+0.0025});
        coords.push({lat: center[0]-0.0025, lng: center[1]-0.0025});
        coords.push({lat: center[0]+0.0025, lng: center[1]-0.0025});
        coords.push({lat: center[0]+0.0025, lng: center[1]+0.0025});

        new google.maps.Polygon({
            fillColor: "#28FF00",
            fillOpacity: 0.3+block*.01,
            strokeWeight: 0,
            map: map,
            paths: coords
        });
    }
}












/*
        //get the mins and maxes of each
        var min_avgrev = Number.POSITIVE_INFINITY, min_totalrev = Number.POSITIVE_INFINITY, min_rides = Number.POSITIVE_INFINITY;
        var max_avgrev = -1, max_totalrev = -1, max_rides = -1;
        var count = 0;
        for(var row in rows){
            count ++;
            var info = rows[row];
            min_avgrev = Math.min(min_avgrev, parseFloat(info['Average Revenue']))
            min_totalrev = Math.min(min_totalrev, parseFloat(info['Total Revenue']))
            min_rides = Math.min(min_rides, parseInt(info['Ride Count']))
            max_avgrev = Math.max(max_avgrev, parseFloat(info['Average Revenue']))
            max_totalrev = Math.max(max_totalrev, parseFloat(info['Total Revenue']))
            max_rides = Math.max(max_rides, parseFloat(info['Ride Count']))
        }
        console.log(min_avgrev, max_avgrev, min_totalrev, max_totalrev, min_rides, max_rides);
        var yscale = d3.scale.linear()
                        .domain([0, count])
                        .range([height - padding, padding/2])

        var yaxis = d3.svg.axis().orient("left").scale(yscale).tickValues([0, count]);

        var avgrev_xscale = d3.scale.linear()
                                .domain([min_avgrev, max_avgrev])
                                .range([padding, width-padding])
        var avgrev_xaxis = d3.svg.axis().orient("bottom").scale(avgrev_xscale);

        var totalrev_xscale = d3.scale.linear()
                                .domain([min_totalrev, max_totalrev])
                                .range([padding, width-padding])
        var totalrev_xaxis = d3.svg.axis().orient("bottom").scale(totalrev_xscale);

        var rides_xscale = d3.scale.linear()
                                .domain([min_rides, max_rides])
                                .range([padding, width-padding])
        var rides_xaxis = d3.svg.axis().orient("bottom").scale(rides_xscale);

        d3.selectAll(".graph svg").append("g")
            .attr("class", "yaxis")
            .attr("transform", "translate("+padding+",0)")
            .call(yaxis);

        d3.select("#avg_revenue svg").append("g")
            .attr("class", "xaxis")
            .attr("transform", "translate(0,"+(height-padding)+")")
            .call(avgrev_xaxis);

        d3.select("#total_revenue svg").append("g")
            .attr("class", "xaxis")
            .attr("transform", "translate(0,"+(height-padding)+")")
            .call(totalrev_xaxis);

        d3.select("#total_rides svg").append("g")
            .attr("class", "xaxis")
            .attr("transform", "translate(0,"+(height-padding)+")")
            .call(rides_xaxis);

        d3.selectAll(".xaxis text")  // select all the text elements for the xaxis
            .attr("transform", function(d) {
                return "translate(" + this.getBBox().height*-2 + "," + (this.getBBox().height+15) + ")rotate(-45)";
            });

        //Split the domain into 100 equal-sized pieces to partition the data
        ride_pieces = rides_xscale.ticks(100)
        arev_pieces = avgrev_xscale.ticks(100)
        trev_pieces = totalrev_xscale.ticks(100)

        ride_dict = {}
        arev_dict = {}
        trev_dict = {}
        for(var row in rows){
            var info = rows[row];
            index = Math.floor(parseFloat(info['Ride Count'])/(max_rides)*100)
            val = ride_pieces[index]
            if(val == undefined){continue;}
            if(val in ride_dict){
                ride_dict[val] += 1
            }else{
                ride_dict[val] = 1
            }

            index = Math.floor(parseFloat(info['Average Revenue'])/(max_avgrev)*100)
            val = arev_pieces[index]
            if(val == undefined){continue;}
            if(val in arev_dict){
                arev_dict[val] += 1
            }else{
                arev_dict[val] = 1
            }

            index = Math.floor(parseFloat(info['Total Revenue'])/(max_totalrev)*100)
            val = trev_pieces[index]
            if(val == undefined){continue;}
            if(val in trev_dict){
                trev_dict[val] += 1
            }else{
                trev_dict[val] = 1
            }
        }

        console.log(trev_dict)
*/
