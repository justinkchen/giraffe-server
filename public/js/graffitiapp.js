$(function() {
    // generate unique user id
    var userId = Math.random().toString(16).substring(2,15);
    var socket = io.connect("/");
    var map;
 
    var info = $("#infobox");
    var doc = $(document);
 
    var sentData = {}
 
    var connects = {};
    var markers = {};
    var active = false;
 
    socket.on("load:coords", function(data) {
        // remember users id to show marker only once
        if (!(data.id in connects)) {
            setMarker(data);
        }
 
        connects[data.id] = data;
        connects[data.id].updated = $.now(); // shorthand for (new Date).getTime()
    });
 
    // check whether browser supports geolocation api
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(positionSuccess, positionError, { enableHighAccuracy: true });
    } else {
        $(".map").text("Your browser is out of fashion, there\'s no geolocation!");
    }
 
    function positionSuccess(position) {
        var lat = position.coords.latitude;
        var lng = position.coords.longitude;
        var acr = position.coords.accuracy;
 
        // mark user's position
        var userMarker = L.marker([lat, lng], {
            icon: redIcon
        });
 

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
 
    doc.bind("mouseup mouseleave", function() {
        active = false;
    });
 
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
});