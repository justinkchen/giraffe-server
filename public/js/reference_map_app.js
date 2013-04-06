$(function() {
    // generate unique user id
    var userId = Math.random().toString(16).substring(2,15);
    var socket = io.connect("/");
    var map;
 
    var info = $("#infobox");
    var doc = $(document);
 
    // custom marker's icon styles
    var tinyIcon = L.Icon.extend({
        options: {
            shadowUrl: "../assets/marker-shadow.png",
            iconSize: [25, 39],
            iconAnchor:   [12, 36],
            shadowSize: [41, 41],
            shadowAnchor: [12, 38],
            popupAnchor: [0, -30]
        }
    });
    var redIcon = new tinyIcon({ iconUrl: "../assets/marker-red.png" });
    var yellowIcon = new tinyIcon({ iconUrl: "../assets/marker-yellow.png" });
 
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
 
        // load leaflet map
        map = L.map('map', {
    			center: [lat, lng],
    			zoom: 16 
	});

        // leaflet API key tiler
        L.tileLayer("http://{s}.tile.cloudmade.com/BC9A493B41014CAABB98F0471D759707/997/256/{z}/{x}/{y}.png", { maxZoom: 18, detectRetina: true }).addTo(map);
         
        // set map bounds
        // map.fitWorld();
        userMarker.addTo(map);
        userMarker.bindPopup("<p>You are here! Your ID is " + userId + "</p>").openPopup();
 
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
 
    // showing markers for connections
    function setMarker(data) {
        for (i = 0; i < data.coords.length; i++) {
            var marker = L.marker([data.coords[i].lat, data.coords[i].lng], { icon: yellowIcon }).addTo(map);
            marker.bindPopup("<p>One more external user is here!</p>");
            markers[data.id] = marker;
        }
    }
 
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
 
    // delete inactive users every 15 sec
    setInterval(function() {
        for (ident in connects){
            if ($.now() - connects[ident].updated > 15000) {
                delete connects[ident];
                map.removeLayer(markers[ident]);
            }
        }
    }, 15000);
});
