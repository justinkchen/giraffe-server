var radius = 6371.0;

/* Computes the Haversine distance between the 2 coordinates
 * Returns distance in terms of km */
exports.distance = function(lat1, lon1, lat2, lon2) {
    
    var latd = deg2rad(lat2 - lat1);
    var lond = deg2rad(lon2 - lon1);
    
    var a = Math.sin(latd / 2) * Math.sin(latd / 2) +
	Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
	Math.sin(lond / 2) * Math.sin(lond / 2);
    
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return radius * c;
};

/* Conversion functions
 * km to m
 * km to miles
 * km to ft?

*/

function deg2rad(deg) {
    return deg * Math.PI / 180.0;
}

function rad2deg(rad) {
    return rad * 180.0 / Math.PI;
}