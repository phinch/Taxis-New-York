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

    for(i = 0; i < store_limit; i++){
        loadDayJSON();
    }

    //Increments the time by 1 hour
    function nextHour(date){
        date.setTime(date.getTime() + 60*60*1000);
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
        doHour();
    }

    var in_this_hour = {};
    function doHour(){
        //Move to the next hour
        nextHour(time);

        //If needed, update the day
        checkDay(time);

        in_this_hour = {};

        //If needed, update the month
        checkDay(time);

        //Delete all circles
        //deleteCircles();

        //Clear instance listeners

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

        $("#text-time").text(formatTimeString());
        $("#date").text(time.toLocaleDateString());

        circles = in_this_hour;

        window.setTimeout(doHour, hourPeriod);
    }

    function showWindow(contentstring, latlng){
        infoWindow.setContent(contentstring);
        infoWindow.setPosition(latlng);
        infoWindow.open(map);
    }

    var colors = ["#FF0000", "#FF9F00", "#38BE00"];

    //The following ranges were calculated by scripts. 
    //The lower number is the median from the data; the upper number is one standard deviation away
    //The third is the median
    var rev_ranges = [74.46, 3915.90];
    var avg_rev_ranges = [14.48, 49.03];
    var tip_ranges = [7.56, 2951.23];
    var avg_tip_ranges = [2.42, 28.57];
    var dist_ranges = [15.2, 90012.64];
    var avg_dist_ranges = [2.65, 6993.12];

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
        }else if(colorvar > color_range[1]){
            color = colors[2];
        }else{
            color = colors[1];
        }
        return color;
    }

    function getOpacity(block){
        return Math.min(1, block["rides"]/100*5);
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

        //TODO: Update information
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
});
