$(document).ready(function(){

    var baseWidth = 13708,
        baseHeight = 7590,
        CRSWidth = 1000,
        CRSHeight = 1000,
        maxBounds = [[-baseHeight/2,-baseWidth/2],[baseHeight/2,baseWidth/2]],
        offsetX = (baseWidth-CRSWidth)/2,
        offsetY = (baseHeight-CRSHeight)/2,
        host = window.location.host,
        cdnHost = '{s}.cdn.'+host,
        cdnSubdomains = 'abcdef',
        tileTemplate = 'http://'+cdnHost+'/tile/{z}/{x}/{y}';


    var bounds = [[0,0],[baseHeight,baseWidth]];

    var tileLayer = L.tileLayer(tileTemplate,
        {
            foo:'bar',
            subdomains:cdnSubdomains,
            minZoom:-6,
            maxZoom:0,
            maxNativeZoom:0,
            minNativeZoom:-6
        }
    );

    var map = L.map('map', {
        attributionControl:false, // cache l’attribution Leaflet
        crs: L.CRS.Simple, // Coordinate Reference System
        maxBounds:maxBounds,
        minZoom:-5,
        maxZoom:0,
        layers:[tileLayer],
    });

    map.fitBounds(maxBounds);


    //
    // 13708,7590
    //

})