$(function() {
    // generate unique user id
    var userId = Math.random().toString(16).substring(2,15);
    var socket = io.connect("/");
    var pointArray, heatmap, map, locationData;
    var info = $("#infobox");
    var doc = $(document);
 
    var sentData = {}
 
    var markers = {};

    var latitude, longitude, userid;

    socket.on("load:coords", function(data) {
         var locationData = new Array();
         // display posts requested by specific user
         for(var i in data) {
             locationData.push(new google.maps.LatLng(data[i].latitude, data[i].longitude));
        }
        pointArray = new google.maps.MVCArray(locationData);
        heatmap = new google.maps.visualization.HeatmapLayer({
            data: pointArray
        });
        heatmap.setOptions({radius: 50});
        heatmap.setOptions({dissipating: true});
        heatmap.setMap(map);
    });

    function initialize() {
        latitude = parseFloat(getUrlVars()["latitude"]);
        longitude = parseFloat(getUrlVars()["longitude"]);

	// Demo purposes only
        latitude = 37.426854;
        longitude = -122.171853;
	//
        userid = parseFloat(getUrlVars()["userid"]);
	 // TODO: socket.emit the userid, latitude, and longitude and have server only broadcast a userid tagged list of locations so each user doesn't get the whole database
        if(!latitude){
            latitude = 0;
        }
        if(!longitude){
            longitude = 0;
        }
        if(!userid){
            userid = 0;
        }
        var myLatlng = new google.maps.LatLng(latitude,longitude);
        var mapOptions = {
            zoom: 17,
            center: myLatlng,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };

        map = new google.maps.Map(document.getElementById('map_canvas'),
              mapOptions);

        var marker = new google.maps.Marker({
                position: myLatlng,
                map: map,
                title: 'You are here!'
        });

        //pointArray = new google.maps.MVCArray(locationData);
        //heatmap = new google.maps.visualization.HeatmapLayer({
        //    data: pointArray
        //});

        //heatmap.setMap(map);

    }

    function getUrlVars() {
        var vars = {};
        var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
         if(vars[key]){
             if(vars[key] instanceof Array){
                 vars[key].push(value);
             }else{
        vars[key] = [vars[key], value];
             }
         }else{
             vars[key] = value;
         }
        });
        return vars;
    }

 /*
    function positionSuccess(position) {
        var lat = position.coords.latitude;
        var lng = position.coords.longitude;
        var acr = position.coords.accuracy;
 

        // send coords on when user is active
        doc.on("mousemove", function() {
            active = true; 
 
            sentData = {
                id: userId,
                active: active,
                coords: [{
                    lat: lat,
                    lng: lng,
                    acr: acr
                }]
            }
            socket.emit("send:coords", sentData);
        });
    }
 */

    // handle geolocation api errors
    function positionError(error) {
        var errors = {
            1: "Authorization fails", // permission denied
            2: "Can\'t detect your location", //position unavailable
            3: "Connection timeout" // timeout
        };
        showError("Error:" + errors[error.code]);
    }
 
    function showError(msg) {
        info.addClass("error").text(msg);
    }

    google.maps.event.addDomListener(window, 'load', initialize);
});