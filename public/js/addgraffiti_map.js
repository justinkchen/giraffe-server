$(function() {
    var socket = io.connect("/");
    var pointArray, heatmap, map, locationData;
    var info = $("#infobox");
    var doc = $(document);

    var latitude, longitude, userid;

    var circle;

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

        circle = new google.maps.Circle({
            strokeColor: "#FF0000",
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: "#FF0000",
            fillOpacity: 0.35,
            map: map,
            radius: 500
        });
        circle.bindTo('center', marker, 'position');

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

    function updateRadius(rad){
      circle.setRadius(rad);
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

    google.maps.event.addDomListener(window, 'load', initialize);
});