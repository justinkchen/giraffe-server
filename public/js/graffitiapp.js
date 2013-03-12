$(function() {
    // generate unique user id
    var userId = Math.random().toString(16).substring(2,15);
    var socket = io.connect("/");
    var pointarray, heatmap, map;
    var info = $("#infobox");
    var doc = $(document);
 
    var sentData = {}
 
    var markers = {};

    var latitude, longitude, userid;

    socket.on("load:coords", function(data) {

        var locationData = new Array();
        // display posts requested by specific user
        for(var post in data) {
            if(post.user_id == userid){
                locationData.push(new google.maps.LatLng(post.latitude, post.longitude));
            }
        }
        pointArray = new google.maps.MVCArray(locationData);
        heatmap = new google.maps.visualization.HeatmapLayer({
            data: pointArray
        });

        heatmap.setMap(map);
    });
 
    // check whether browser supports geolocation api
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(positionSuccess, positionError, { enableHighAccuracy: true });
    } else {
        $(".map_canvas").text("Your browser is out of fashion, there\'s no geolocation!");
    }

    function initialize() {
        latitude = parseFloat(getUrlVars()["latitude"]);
        longitude = parseFloat(getUrlVars()["longitude"]);
        userid = parseFloat(getUrlVars()["userid"]);
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
            zoom: 14,
            center: myLatlng,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };

        var map = new google.maps.Map(document.getElementById('map_canvas'),
                mapOptions);

        var marker = new google.maps.Marker({
                position: myLatlng,
                map: map,
                title: 'You are here!'
        });

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