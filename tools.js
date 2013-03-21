/* Computes the Haversine distance between the 2 coordinates
 * Returns distance in terms of km */
exports.distance = function(lat1, lon1, lat2, lon2) {
    latd = deg2rad(lat2 - lat1);
    lond = deg2rad(lon2 - lat1);
    a = Math.sin(latd / 2) * Math.sin(latd / 2) +
	Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
	Math.sin(lond / 2) * Math.sin(lond / 2);
    c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return 6371.0 * c;
};

function deg2rad(deg) {
    return deg * Math.PI / 180;
}