$(document).ready(function(){

    var baseWidth = 13708,
        baseHeight = 7590,
        CRSWidth = 1000,
        CRSHeight = 1000,
        offsetX = (baseWidth-CRSWidth)/2,
        offsetY = (baseHeight-CRSHeight)/2,
        host = window.location.host;


    var bounds = [[0,0],[baseHeight,baseWidth]];

    var tileLayer = L.tileLayer('http://{s}.cdn.'+host+'/tile/{z}/{x}/{y}',
        {
            foo:'bar',
            subdomains:'abcdef',
            minZoom:-6,
            maxZoom:0,
            maxNativeZoom:0,
            minNativeZoom:-6
        }
    );

    var map = L.map('map', {
        attributionControl:false, // cache l’attribution Leaflet
        crs: L.CRS.Simple, // Coordinate Reference System
        //maxBounds:bounds,
        minZoom:-5,
        maxZoom:0,
        layers:[tileLayer],
    });

    map.fitBounds([[0,0],[1000,1000]]);


    //
    // 13708,7590
    //

})