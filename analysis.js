var combined_metrics;
var block_rank;
$(document).on("ready", function(){
    if($(window).height() > $("#header").height()){
        $("#header").height($(window).height()-51);
        $(".image").css("margin-top", ($(window).height()-$(".image").height())/2-25);
    }

    d3.csv("Rankings/graph_data.csv", function(error, rows){
        drawScatter("#arev_rides", 'Average Revenue', 'Ride Count', rows)
        drawScatter("#trev_rides", 'Total Revenue', 'Ride Count', rows)
        drawScatter("#arev_trev", 'Average Revenue', 'Total Revenue', rows)
    });

    d3.csv("Rankings/combined_metrics.csv", function(error, blocks){
        drawMap(combined_metrics, blocks, 25);
    });

    d3.csv("Rankings/Top_25.csv", function(error, blocks){
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
