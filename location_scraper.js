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
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 40.7577, lng: -73.9857},
        zoom: 15,
        minZoom: 12
    });
}
$(document).on("ready", function(){
    xhttp = new XMLHttpRequest();

    urlbase = "https://data.cityofnewyork.us/resource/2yzn-sicd.json?$$app_token=cU8jotGqWfexWUODoB0zXA1Yl";

    limit = 50000;
    datestart = "2015-05-02T00:00:00";
    dateend = "2015-05-02T23:59:59";

    console.log(urlbase+"&$limit='"+limit+"'&where=pickup_datetime between '"+datestart+"' and '"+dateend+"'");

    xhttp.onreadystatechange = function() {
        if (xhttp.readyState == 4 && xhttp.status == 200) {
          console.log(xhttp.responseText);
        }else{
            console.log(xhttp.status);
        }
    };
    
    xhttp.open("GET", urlbase+"&$limit='"+limit+"'&where=pickup_datetime between '"+datestart+"' and '"+dateend+"'", true);
    xhttp.send();
});
