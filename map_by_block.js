/*{
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
}*/

var map;
var infoWindow;
var geocoder;
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 40.7126, lng: -74.0083},
        zoom: 13,
        minZoom: 11,
        disableDefaultUI: true
    });
    geocoder = new google.maps.Geocoder;
    infoWindow = new google.maps.InfoWindow();
}
//The length of time, in milliseconds, given to one hour
var hourPeriod = 10000;

//In the case of the data we have, only 6 months, January-June, are present. This variable represents that.
var num_months = 6;
var months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"]

var clockStarted = false;
var store_month = 0 
var store_limit = 7;
var stored = [];

var time = new Date("December 31, 2014 23:00:00");
var loadDate = new Date("January 1, 2015");

var sliderpos;
var barwidth;

//Increments the time by 1 hour
function nextHour(date){
    date.setTime(date.getTime() + 60*60*1000);
    while($(".hour."+date.getHours()).attr("on") == "false"){
        date.setTime(date.getTime() + 60*60*1000);
    }
}

function nextDay(date){
    date.setTime(date.getTime() + 24*60*60*1000);
}

function formatTime(date){
    var datestring = date.getFullYear()+"-";
    var month = parseInt(date.getMonth()) + 1;
    if(month < 10){
        month = "0"+month;
    }
    datestring += month.toString() + "-";
    var day = parseInt(date.getDate());
    if(day < 10){
        day = "0"+day;
    }
    datestring += day.toString() + " ";
    var hour = parseInt(date.getHours());
    if(hour < 10){
        hour = "0"+hour;
    }
    datestring += hour+":00:00";
    console.log(datestring);
    return datestring;
}

function formatTimeString(){
    var timeString = time.toLocaleTimeString(); //in form 00:00:00 AM
    return parseInt(timeString.split(":")[0]) + " " + timeString.split(" ")[1].toLowerCase();
}

function formatDateString(){
    var dateString = time.toDateString().split(" ");
    return;
}

function checkDay(date){
    if(date.getMonth() == num_months){
        date.setTime("December 31, 2014 23:00:00");
    }
    if(date.getDay() != day){
        day = date.getDay();
        today = stored.shift();
        loadDayJSON();
    }
}

function convertBlock(b){
    return {lat: parseFloat(b.split(" ")[0]), lng: parseFloat(b.split(" ")[1])}
}

function loadDayJSON(){
    date = loadDate.toISOString().split("T")[0];
    var filename = "../day_jsons/"+date+".json";
    
    $.getJSON(filename, function(data){
        stored.push(data);

        if(!clockStarted){

            clockStarted = true;
            $("#text-time").text(formatTimeString());
            startClock();
        }

    });

    nextDay(loadDate);
}

//This function runs indefinitely once the data has been loaded. 
//It cycles through the months, one hour at a time, updating the map as it goes
var day = -1;
var circles = {};
var today = {};
function startClock(){
    //TODO: The clock is out of sync with the time. Can we animate it while keeping it in line with lag?
    //$(".minutes-container").css("animation", "rotate "+ hourPeriod/1000 +"s infinite linear");
    //$(".hours-container").css("animation", "rotate "+ hourPeriod*12/1000 +"s infinite linear");
    google.maps.event.addListenerOnce(map, 'idle', function(){
        doHour();
    });
}

var in_this_hour = {};
var timeout;
function doHour(){
    //Move to the next hour
    nextHour(time);

    //If needed, update the day
    checkDay(time);

    in_this_hour = {};

    //If needed, update the month
    checkDay(time);

    //Delete all circles (not currently used; circles are updated, not deleted)
    //deleteCircles();

    //For each block, find if the applicable hour exists and, if so, create a circle for it
    var formatted_time = formatTime(time);
    var this_hour = today[formatted_time];
    //Each object in this_hour is a block
    for(var b in this_hour){
        var block = this_hour[b];
        var lat = parseFloat(b.split(" ")[0]);
        var lng = parseFloat(b.split(" ")[1]);
        if(b in circles){
            in_this_hour[b] = circles[b];
            changeCircle(b, block);
            Object.defineProperty(circles, b, {enumerable: false});
            //delete circles[b];
        }else{
            addCircle(b, block);
        }
    }

    for(var c in circles){
        in_this_hour[c] = circles[c];
        zeroCircle(c);
    }

    //TODO: The updating of the clock is completely out-of-sync with the circles' updating.
    // Could we possibly use events to keep the changes more tightly bound? 
    $("#text-time").text(formatTimeString());
    $("#date").text(time.toLocaleDateString());

    circles = in_this_hour;

    //Set the period until the next update
    hourPeriod = getHourPeriod();
    timeout = window.setTimeout(doHour, hourPeriod);
}

function showWindow(contentstring, latlng){
    infoWindow.setContent(contentstring);
    infoWindow.setPosition(latlng);
    infoWindow.open(map);
}

var colors = ["#A60002", "#FF6800", "#FFF700", "#28FF00"];

//The following ranges were calculated by scripts. 
//The lower number is the median from the data; the upper number is one median absolute deviation away

/*
Statistic,Revenue,Tips,Distance,Passengers,Avg Revenue,Avg Tips,Avg Distance,Avg Passengers,Rides
Median,74.46,7.56,15.2,7.0,14.48,2.42,2.65,1.53,4.0
Mean,637.49,69.44,654.92,67.59,19.85,3.38,11.31,1.65,40.19
Median Absolute Deviation,95.42,11.21,20.46,8.9,5.23,0.9,1.44,0.7,4.45
Standard Deviation,3278.42,2881.8,89357.7,136.44,29.18,25.2,6981.82,0.85,80.49
*/

var rev_med = 74.46, tip_med = 7.56, dist_med = 15.2, pass_med = 7.0, a_rev_med = 14.48, a_tip_med = 2.42, a_dist_med = 2.65, a_pass_med = 1.53, ride_med = 4.0;
var rev_mean = 637.49, tip_mean = 69.44, dist_mean = 654.92, pass_mean = 67.59, a_rev_mean = 19.85, a_tip_mean = 3.38, a_dist_mean = 11.31, a_pass_mean = 1.65, ride_mean = 40.19;
var rev_mad = 95.42, tip_mad = 11.21, dist_mad = 20.46, pass_mad = 8.9, a_rev_mad = 5.23, a_tip_mad = 0.9, a_dist_mad = 1.44, a_pass_mad = 0.7, ride_mad = 4.45;
var rev_std = 3278.42, tip_std = 2881.8, dist_std = 89357.7, pass_std = 136.44, a_rev_std = 29.18, a_tip_std = 25.2, a_dist_std = 6981.82, a_pass_std = 0.85, ride_std = 80.49;

//An initial pass of the data, as shown above, gave a massive amount of variance in the data; instead of using standard deviation, I'm experimenting here with 
//  Median Absolute Deviation (or MAD), which is said to reduce the impact of large outliers
//To differentiate between blocks, we create some arbitrary number of divisions; each category a degree greater

var rev_ranges = [rev_med, rev_med+rev_mad, rev_med+(Math.pow(rev_mad,1.5))];
var avg_rev_ranges = [a_rev_med, a_rev_med+a_rev_mad, a_rev_med+(Math.pow(a_rev_mad,1.5))];
var tip_ranges = [tip_med, tip_med+tip_mad, tip_med+(Math.pow(tip_mad,1.5))];
var avg_tip_ranges = [a_tip_med, a_tip_med+a_tip_mad, a_tip_med+(Math.pow(a_tip_mad,1.5))];
var dist_ranges = [dist_med, dist_med+dist_mad, dist_med+(Math.pow(dist_mad,1.5))];

var avg_dist_ranges = [a_dist_med, a_dist_med+a_dist_mad, a_dist_med+(Math.pow(a_dist_mad,1.5))];

var color_ranges = {"revenue": rev_ranges, "tips": tip_ranges, "distance": dist_ranges};
var size_ranges = {"avg_revenue": avg_rev_ranges, "avg_tips": avg_tip_ranges, "avg_distance": avg_dist_ranges};

function getRadius(block){
    var size_filter = $(".dropdown.size").children("[filter='true']").attr("value");
    var sizevar = block[size_filter];
    return sizevar/size_ranges[size_filter][0]*100;
}

function getColor(block){
    var color_filter = $(".dropdown.color").children("[filter='true']").attr("value");
    var colorvar = block[color_filter];

    var color_range = color_ranges[color_filter];
    if(colorvar < color_range[0]){
        color = colors[0];

    }else if(colorvar < color_range[1]){
        color = colors[1];
    }else if(colorvar < color_range[2]){
        color = colors[2];
    }else{
        color = colors[3];
    }
    return color;
}

function getOpacity(block){
    return Math.max(0.01, parseInt(block["rides"])/(ride_mean+ride_std));

}

//Calculates the speed of the hour based on the position of the speed slider in the toolbar
function getHourPeriod(){
    return Math.round(3000/(sliderpos/barwidth));
}

function addCircle(b, block_hour){
    var latlng = convertBlock(b);
    var rides = parseInt(block_hour["rides"]);

    radius = getRadius(block_hour);
    color = getColor(block_hour);

    var opacity = getOpacity(block_hour);

    var cityCircle = new google.maps.Circle({
        strokeColor: color,
        strokeOpacity: opacity,
        strokeWeight: 1,
        fillColor: color,
        fillOpacity: opacity,
        map: map,
        center: latlng,
        radius: radius,
        clickable: true
    });

    google.maps.event.addListener(cityCircle, 'click', function(event){
        formatInfo(b, block_hour);
    });

    in_this_hour[b] = cityCircle;
}

function deleteCircles(){
    for (var i in circles) {
        circles[i].setMap(null);
    }
    circles = {};
}


function changeCircle(b, block){
    radius = getRadius(block);
    color = getColor(block);
    opacity = getOpacity(block);

    var circle = in_this_hour[b];
    circle.setOptions({
        strokeColor: color,
        strokeOpacity: opacity,
        strokeWeight: 1,
        fillColor: color,
        fillOpacity: opacity,
        radius: radius
    });

    //Update information
    google.maps.event.clearInstanceListeners(circle);
    google.maps.event.addListener(circle, 'click', function(event){
        formatInfo(b, block);
    });

    //TODO: An animation of resizing would be nice, but currently seems to overwhelm the machine. Alternatives?
    /*

    var upordown = circle.getRadius < radius;
    var interval = window.setInterval(function(){
        if(circle.getRadius() != radius){
            if(upordown){
                circle.setRadius(circle.getRadius() + 1);

            }else{
                circle.setRadius(circle.getRadius() - 1);
            }
        }else{

            clearInterval(interval);
        }
    }, 10);
    */
}

function zeroCircle(b){
    in_this_hour[b].setRadius(0);
}
/*
function updateCircles(){
    for(var c in circles){
        if(!(c in in_this_hour)){
            changeCircle(c, 0);

        }
    }
    for(var b in in_this_hour){
        if(b in circles){

            changeCircle(b, in_this_hour[b]);
        }else{
            addCircle(b, in_this_hour[b]);
        }
    }

}
*/
function formatInfo(b, info){
    var contentString = "";
    var block = convertBlock(b);
    geocoder.geocode({'location': block}, function(results, status) {
        var location = results[0].formatted_address.split(",")[0];
        contentString += "<b>"+location+", "+formatTimeString(time)+"</b><br>";

        contentString += info["rides"];
        if(parseInt(info["rides"]) > 1){
            contentString += " rides";
        }else{
            contentString += " ride";
        }

        contentString += " totaling $"+info["revenue"]+"<br>";
        contentString += "Rides averaged at " + info["avg_distance"] + " miles";
        
        showWindow(contentString, block);
    });
}

$(document).on("ready", function(){
    for(i = 0; i < store_limit; i++){
        loadDayJSON();
    }
});
