function getUserLocation() { 
        //check if the geolocation object is supported, if so get position
  if (navigator.geolocation)
    navigator.geolocation.getCurrentPosition(displayLocation, displayError);
  else
    document.getElementById("locationData").innerHTML = "Sorry - your browser doesn't support geolocation!";
}

function initialize(position) {
  var mapOptions = {
    center: new google.maps.LatLng(position.coords.latitude, position.coords.longitude),
    zoom: 0,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };
  map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
}

function displayLocation(position) { 
  var initialLocation = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);
  // Location for Test purposes
  // var initialLocation = new google.maps.LatLng(37.426854,-122.171853);
  //build text string including co-ordinate data passed in parameter
  var displayText = "User latitude is " + position.coords.latitude + " and longitude is " + position.coords.longitude;

  //display the string for demonstration
  document.getElementById("locationData").innerHTML = displayText;
  var mapOptions = {
      center: initialLocation,
      zoom: 18,
      mapTypeId: google.maps.MapTypeId.ROADMAP
  };
  var map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
  var marker = new google.maps.Marker({
    position: initialLocation,
    map: map,
    title: "You are here"
  });
  marker.setMap(map);
 
}


function pinMessages(map,initialLocation){

  var pinLocation = new google.maps.LatLng(37.4268,-122.172853);
  var newmarker = new google.maps.Marker({
    position: pinLocation,
    map: map,
    title: "Pin"
  }); 
  newmarker.setMap(map);


}




function displayError(error) { 
  //get a reference to the HTML element for writing result
  var locationElement = document.getElementById("locationData");

  //find out which error we have, output message accordingly
  switch(error.code) {
  case error.PERMISSION_DENIED:
    locationElement.innerHTML = "Permission was denied";
    break;
  case error.POSITION_UNAVAILABLE:
    locationElement.innerHTML = "Location data not available";
    break;
  case error.TIMEOUT:
    locationElement.innerHTML = "Location request timeout";
    break;
  case error.UNKNOWN_ERROR:
    locationElement.innerHTML = "An unspecified error occurred";
    break;
  default:
    locationElement.innerHTML = "Who knows what happened...";
    break;
}}
