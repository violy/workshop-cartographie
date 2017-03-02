jQuery(document).ready(function($){

    var pathExp = /map\/([0-9A-Fa-f]{40})$/g,
        uidExec = pathExp.exec(location.pathname),
        uid = uidExec ? uidExec[1] : false,
        baseWidth = 13708,
        baseHeight = 7590,
        CRSWidth = 1000,
        CRSHeight = 1000,
        atlas,
        maps,
        minZoom = -5,
        host = location.host,
        cdnHost = '{s}.cdn.' + host,
        cdnSubdomains = 'abc',
        tileTemplate = 'http://' + cdnHost + '/tile/{s}/{z}/{x}/{y}';

    function Fail(){
        alert('désolé, une erreur est survenue...');
    }

    $.ajax({
        url:'/atlas.json',
        dataType:'json'
    }).done(function(data){
        atlas = data;
        maps = atlas.maps;
        Setup();
    }).fail(Fail)

    function Setup() {

        var maxBounds = [[-baseHeight / 2, -baseWidth / 2], [baseHeight / 2, baseWidth / 2]],
            offsetX = (baseWidth - CRSWidth) / 2,
            offsetY = (baseHeight - CRSHeight) / 2;


        var bounds = [[0, 0], [baseHeight, baseWidth]];

        // var tileLayer = L.tileLayer(tileTemplate,
        //     {
        //         foo: 'bar',
        //         subdomains: cdnSubdomains,
        //         minZoom: -6,
        //         maxZoom: 0,
        //         maxNativeZoom: 0,
        //         minNativeZoom: -6
        //     }
        // );

        var map = L.map('map', {
            attributionControl: false, // cache l’attribution Leaflet
            crs: L.CRS.Simple, // Coordinate Reference System
            maxBounds: maxBounds,
            minZoom: minZoom,
            maxZoom: 0,
            layers: [],
        });

        maps.forEach(function(meta){
            var bounds = [[0,0],[meta.width,meta.height]];
            var layer = L.rectangle(bounds,{
                color: "#ff7800", weight: 1
            })
            layer.addTo(map);
        });

        map.fitBounds(maxBounds);

    }
    //
    // 13708,7590
    //



});