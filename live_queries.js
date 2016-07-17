//Google Maps API Key
//AIzaSyCsMLSl5Cdy_cEPbnpNS1zEhkpZPLhf0q4

//data
//https://data.cityofnewyork.us/resource/2yzn-sicd.json

//App Token: cU8jotGqWfexWUODoB0zXA1Yl

/*{
    "dropoff_datetime":"2015-01-06T18:17:33.000",
    "dropoff_latitude":"40.755485534667969",
    "dropoff_longitude":"-73.968955993652344",
    "extra":"1",
    "fare_amount":"29.5",
    "mta_tax":"0.5",
    "passenger_count":"1",
    "payment_type":"1",
    "pickup_datetime":"2015-01-06T17:59:51.000",
    "pickup_latitude":"40.770015716552734",
    "pickup_longitude":"-73.863929748535156",
    "rate_code":"1",
    "store_and_fwd_flag":"N",
    "tip_amount":"4.75",
    "tolls_amount":"5.33",
    "total_amount":"41.38",
    "trip_distance":"10.6",
    "vendor_id":"1"
}*/

var map;
var infoWindow;
var geocoder;
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 40.7687, lng: -73.9817},
        zoom: 13,
        minZoom: 11,
        disableDefaultUI: true
    });
    geocoder = new google.maps.Geocoder;
    infoWindow = new google.maps.InfoWindow();
}

$(document).on("ready", function(){
    xhttp = new XMLHttpRequest();

    //order by mta_tax, a constant, to get a more uniform distribution of times of day
    var urlbase = "https://data.cityofnewyork.us/resource/2yzn-sicd.json?$$app_token=cU8jotGqWfexWUODoB0zXA1Yl&$order=mta_tax";

    //The number of rides displayed per day. 
    //The dataset contains about 77,000,000 rows, so theoretically the max here is about 210,000 (assuming even distribution) 
    var limit = 100000;
    
    //The length of time, in milliseconds, given to each day
    //(for lag handling, should probably be no less than about limit*30 (machine performance depending))
    var period = 3000000;
    var persecond = period/86400;

    //The length of time that taxis will stay on the map after being loaded
    //(e.g. period/24 means each taxi stays on the map for the equivalent of 1 hour)
    var duration = period/24;

    var currmonth = "01";
    var currday = "01";
    var currhour = 12;
    var currmin = "00";

    xhttp.addEventListener("load", addToQueue);

    //To prevent hangtime between days, we'll keep a small storage space for the next few days of rides
    var ride_queue = [];

    //Initially fill the queue with 5 days (5 is fairly arbitrary, 3 should be enough)
    for(var i = 0; i < 5; i++){
        liveQuery();
    }

    var firstcall = true;
    function addToQueue(){
        var rides = JSON.parse(this.responseText);
        ride_queue.push(rides);
        if(firstcall){
            firstcall = false;
            processData();
            $(".minutes-container").css("animation", "rotate "+ period/24/1000 +"s infinite linear");
            $(".hours-container").css("animation", "rotate "+ period/2/1000 +"s infinite linear");
            console.log($("text-time").text(), $("text-time"));
            $("#text-time").text("12:00 am");
            window.setInterval(updateTime, period/24/12);
            window.setInterval(updateDate, period);
        }
    }

    var currmeridian = " am";
    function updateTime(){
        currmin = parseInt(currmin)+5;
        if(currmin == 5){
            currmin = "05";
        }else if (currmin == 60){
            currmin = "00";
            currhour += 1;
            if(currhour == 12){
                if(currmeridian == " am"){
                    currmeridian = " pm";
                }else{
                    currmeridian = " am";
                }
            }else if(currhour == 13){
                currhour = 1;
            }
        }
        $("#text-time").text(currhour + ":" + currmin + currmeridian);
    }

    var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    function updateDate(){
        var currdate = $("#date").text().split(" ");
        var day = parseInt(currdate[1]);
        var month = currdate[0];

        if(day == 31 && month == "December"){
            day = 1;
            month = months[0];
        }else if(day == 31){
            day = 1;
            month = months[months.indexOf(month)+1];
        }else if(day == 30 && ["April", "June", "September", "November"].indexOf(month) > -1){
            day = 1;
            month = months[months.indexOf(month)+1];
        }else if(day == 28 && month == "February"){
            day = 1;
            month = "March";
        }else{
            day++;
        }
        $("#date").text(month + " " + day);
    }

    //Given a ride object, formats the accompanying Info Window with the information of the ride
    function formatInfo(ride, pickup){
        var pickupLatlng = {lat: parseFloat(ride.pickup_latitude), lng: parseFloat(ride.pickup_longitude)};
        var dropoffLatlng = {lat: parseFloat(ride.dropoff_latitude), lng: parseFloat(ride.dropoff_longitude)};

        geocoder.geocode({'location': pickupLatlng}, function(results, status) {
            if (status === google.maps.GeocoderStatus.OK) {
                var pickupLoc = results[0].formatted_address.split(",")[0];
                geocoder.geocode({'location': dropoffLatlng}, function(results, status) {
                    if (status === google.maps.GeocoderStatus.OK) {
                        var dropoffLoc = results[0].formatted_address.split(",")[0];

                        var pickuptime = ride.pickup_datetime.split("T")[1].split(":");
                        var phour, pminute, pmeridian;
            
                        pminute = pickuptime[1];

                        if(parseInt(pickuptime[0]) < 12){
                            pmeridian = " am";
                            phour = pickuptime[0];
                        }else{
                            pmeridian = " pm";
                            phour = parseInt(pickuptime[0]) - 12;
                        }

                        if(pickuptime[0] == 0){
                            phour = 12;   
                        }

                        var ptime = phour + ":" + pminute + pmeridian;

                        var dropofftime = ride.dropoff_datetime.split("T")[1].split(":");
                        var dhour, dminute, dmeridian;

                        dminute = dropofftime[1];

                        if(parseInt(dropofftime[0]) < 12){
                            dmeridian = " am";
                            dhour = dropofftime[0];
                        }else{
                            dmeridian = " pm";
                            dhour = parseInt(dropofftime[0]) - 12;
                        }

                        if(dropofftime[0] == 0){
                            dhour = 12;   
                        }

                        var dtime = dhour + ":" + dminute + dmeridian;

                        var contentstring = "Picked up from " + pickupLoc + " at " + ptime + "<br>";
                        contentstring += "Dropped off at " + dropoffLoc + " at " + dtime + "<br>";
/*
                        contentstring += "Passengers: " + ride.passenger_count + "<br>";
                        contentstring += "Distance: " + ride.trip_distance + "mi<br>";

                        var fare = ride.fare_amount;
                        if(fare.split(".")[1] && fare.split(".")[1].length == 1){
                            fare += "0";
                        }

                        var tip = ride.tip_amount;
                        if(tip.split(".")[1] && tip.split(".")[1].length == 1){
                            tip += "0";
                        }

                        contentstring += "Fare: $" + fare + "<br>";
                        contentstring += "Tip: $" + tip;
*/
                        if(pickup){
                            showWindow(contentstring, pickupLatlng);
                        }else{
                            showWindow(contentstring, dropoffLatlng);
                        }
                    } else {
                        window.alert('Geocoder failed due to: ' + status);
                    }
                });
            } else {
                window.alert('Geocoder failed due to: ' + status);
            }
        });

    }

    function showWindow(contentstring, latlng){
        infoWindow.setContent(contentstring);
        infoWindow.setPosition(latlng);
        infoWindow.open(map);
    }

    //Sets appropriate timeouts to add circles to the window at their relative pickup/dropoff times
    function processData(){
        var rides = ride_queue.shift();
        for(var r in rides){
            var ride = rides[r];
            var time = ride.pickup_datetime.split("T")[1].split(".")[0].split(":");
            var seconds = parseInt(time[0])*60*60 + parseInt(time[1])*60 + parseInt(time[2]);
            var timeout = seconds*persecond;
            var pickup = {lat: parseFloat(ride.pickup_latitude), lng: parseFloat(ride.pickup_longitude)};

            var droptime = ride.dropoff_datetime.split("T")[1].split(".")[0].split(":");
            var dropseconds = parseInt(droptime[0])*60*60 + parseInt(droptime[1])*60 + parseInt(droptime[2]);
            var droptimeout = dropseconds*persecond;
            var dropoff = {lat: parseFloat(ride.dropoff_latitude), lng: parseFloat(ride.dropoff_longitude)};

            window.setTimeout(addCircle, timeout, pickup, ride, true);
            window.setTimeout(addCircle, droptimeout, dropoff, ride, false);
        }
        //Refill the queue
        window.setTimeout(nextDay, period);
    }

    function nextDay(){
        liveQuery();
        processData();
    }

    function addCircle(latlng, ride, pickup){
        if(pickup){
            color = "#FF0000";
        }else{
            color = "#0000FF";
        }

        var cityCircle = new google.maps.Circle({
            strokeColor: color,
            strokeOpacity: 0.8,
            strokeWeight: 1,
            fillColor: color,
            fillOpacity: 0.35,
            map: map,
            center: latlng,
            radius: 5,
            clickable: true
        });

        google.maps.event.addListener(cityCircle, 'click', function(ev){
            var contentstring = formatInfo(ride, pickup);
        });
        
        window.setTimeout(function(){
            cityCircle.setMap(null);
            cityCircle = null;
        }, duration);
        
    }

    function liveQuery(){
        var datestart = "2015-"+currmonth+"-"+currday+"T00:00:00";
        var dateend = "2015-"+currmonth+"-"+currday+"T23:59:59";

        console.log(currmonth, currday);


        console.log(urlbase+"&$limit="+limit+"&$where=pickup_datetime%20between%20%27"+datestart+"%27%20and%20%27"+dateend+"%27");
        xhttp.open("GET", urlbase+"&$limit="+limit+"&$where=pickup_datetime%20between%20%27"+datestart+"%27%20and%20%27"+dateend+"%27", true);
        xhttp.send();
        
        //Update the date
        if(parseInt(currday) == 31 && parseInt(currmonth) == 12){
            currday = "01";
            currmonth = "01";
        }else if(parseInt(currday) == 31){
            currday = "01";
            currmonth = parseInt(currmonth) + 1;
            if(currmonth < 10){
                currmonth = "0"+currmonth;
            }
        }else if(parseInt(currday) == 30 && ["04", "06", "09", "11"].indexOf(currmonth) > -1){
            currday = "01";
            currmonth = parseInt(currmonth) + 1;
            if(currmonth < 10){
                currmonth = "0"+currmonth;
            }
        }else if(parseInt(currday) == 28 && currmonth == "02"){
            currday = "01";
            currmonth = "03";
        }else{
            currday = parseInt(currday) + 1;
            if(currday < 10){
                currday = "0"+currday;
            }
        }
    }
});
