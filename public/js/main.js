$(document).ready(function(){

    var baseWidth = 13708,
        baseHeight = 7590,
        CRSWidth = 1000,
        CRSHeight = 1000,
        offsetX = (baseWidth-CRSWidth)/2,
        offsetY = (baseHeight-CRSHeight)/2;


    var bounds = [[0,0],[baseHeight,baseWidth]];

    var map = L.map('map', {
        attributionControl:false, // cache l’attribution Leaflet
        crs: L.CRS.Simple, // Coordinate Reference System
        maxBounds:bounds,
        minZoom:-5
    });


    //
    // 13708,7590
    //
    var image = L.imageOverlay('img/Waldseemuller_map_2.jpg', bounds).addTo(map);
    map.fitBounds(bounds);
})