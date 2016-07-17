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

$(document).on("ready", function(){
    
    //The length of time, in milliseconds, given to one hour
    var hourPeriod = 100000;

    //In the case of the data we have, only 6 months, January-June, are present. This variable represents that.
    var num_months = 6;
    var months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"]
    var block_months = []

    var clockStarted = false;
    var store_month = 0 
    for(i = 0; i < num_months; i++){
        var filename = "../block_jsons/"+months[i]+"_blocks.json";
        $.getJSON(filename, function(data){
            block_months[store_month] = data;
            store_month ++;
            if(!clockStarted){
                clockStarted = true;
                $("#text-time").text(formatTimeString());
                startClock();
            }
        });
    }

    var time = new Date("January 1, 2015 00:00:00");

    //Increments the time by 1 hour
    function nextHour(){
        time.setTime(time.getTime() + 60*60*1000);
    }

    function formatTime(date){
        var iso = date.toISOString();
        var day = iso.split("T")[0];
        var hour = iso.split("T")[1].split(".")[0];

        return day + " " + hour;
    }

    function formatTimeString(){
        var timeString = time.toLocaleTimeString(); //in form 00:00:00 AM
        return parseInt(timeString.split(":")[0]) + " " + timeString.split(" ")[1].toLowerCase();
    }

    function formatDateString(){
        var dateString = time.toDateString().split(" ");
        return;
    }

    function checkMonth(){
        if(time.getMonth() == num_months){
            time.setTime("December 31, 2014 23:00:00");
        }
        if(time.getMonth() != month){
            month = time.getMonth();
            this_month = block_months[month];
        }
    }

    function convertBlock(b){
        return {lat: parseFloat(b.split(" ")[0]), lng: parseFloat(b.split(" ")[1])}
    }

    //This function runs indefinitely once the data has been loaded. 
    //It cycles through the months, one hour at a time, updating the map as it goes
    var month = -1;
    var circles = {};
    var in_this_hour = {};
    function startClock(){
        //TODO: The clock is out of sync with the time. Can we animate it while keeping it in line with lag?
        //$(".minutes-container").css("animation", "rotate "+ hourPeriod/1000 +"s infinite linear");
        //$(".hours-container").css("animation", "rotate "+ hourPeriod*12/1000 +"s infinite linear");
        doHour();
    }

    function doHour(){
        in_this_hour = {};
        //Move to the next hour
        nextHour();

        //If needed, update the month
        checkMonth();

        //For each block, find if the applicable hour exists and, if so, create a circle for it
        var formatted_time = formatTime(time);
        for(var b in this_month){
            var block = this_month[b];
            if(!(formatted_time in block)){
                continue;
            }
            var block_hour = block[formatted_time];
            in_this_hour[b] = block_hour;
        }
        updateCircles();
    }

    function showWindow(contentstring, latlng){
        infoWindow.setContent(contentstring);
        infoWindow.setPosition(latlng);
        infoWindow.open(map);
    }

    function addCircle(b, radius){
        var latlng = convertBlock(b);
        var cityCircle = new google.maps.Circle({
            strokeColor: "#000000",
            strokeOpacity: 0.8,
            strokeWeight: 1,
            fillColor: "#000000",
            fillOpacity: 0.35,
            map: map,
            center: latlng,
            radius: 0,
            clickable: true
        });

        google.maps.event.addListener(cityCircle, 'click', function(ev){
            formatInfo(b, in_this_hour[b]);
        });

        circles[b] = cityCircle;
        changeCircle(b, radius);
    }

    function changeCircle(b, radius){
        var circle = circles[b];
        circle.setRadius(Math.round(Math.log(radius)));
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
                interval.clearInterval();
            }
        }, 10);
        */
        //TODO: Update information
    }
    var count = 0;
    function updateCircles(){
        for(var c in circles){
            if(!(c in in_this_hour)){
                changeCircle(c, 0);
            }
        }
        for(var b in in_this_hour){
            if(b in circles){
                changeCircle(b, in_this_hour[b]["revenue"]);
            }else{
                count++;
                addCircle(b, in_this_hour[b]["revenue"]);
            }
        }
        window.setTimeout(doHour, hourPeriod);
        console.log(count);
        $("#text-time").text(formatTimeString());
        $("#date").text(time.toLocaleDateString());
    }

    function formatInfo(b, info){
        var contentString = "";
        var block = convertBlock(b);
        geocoder.geocode({'location': block}, function(results, status) {
            var location = results[0].formatted_address.split(",")[0];
            contentString += "<b>"+location+", "+formatTimeString()+"</b><br>";

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

    function showWindow(contentstring, latlng){
        infoWindow.setContent(contentstring);
        infoWindow.setPosition(latlng);
        infoWindow.open(map);
    }
});
