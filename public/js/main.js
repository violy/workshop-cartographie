$(document).ready(function(){
    var base_url = window.location.origin,
        pathExp = /map\/([0-9A-Fa-f]{40})$/g,
        uidExec = pathExp.exec(location.pathname),
        uid = uidExec ? uidExec[1] : $('#map').data('id-map'),
        baseWidth = 13708,
        baseHeight = 7590,
        CRSWidth = 1000,
        CRSHeight = 1000,
        meta,
        minZoom = -5,
        host = location.host,
        cdnHost = '{s}.cdn.' + host,
        cdnSubdomains = 'abc',
        tileTemplate = location.protocol+'//' + cdnHost + '/tile/{s}/{z}/{x}/{y}';

    function Fail(){
        alert('désolé, une erreur est survenue...');
    }

    if(uid){
        $.ajax({
            url:base_url+'/meta/'+uid,
            dataType:'json'
        }).done(function(data){
            meta = data;
            baseWidth = data.width;
            baseHeight = data.height;
            tileTemplate += '/'+uid;
            minZoom = -data.minZoom;
            console.log(minZoom)
            $('header h2').text(meta.author+' / '+meta.title);
            Setup();
        }).fail(Fail)
    }else{
        tileTemplate += '/default';
        Setup();
    }

    function Setup() {

        var maxBounds = [[-baseHeight / 2, -baseWidth / 2], [baseHeight / 2, baseWidth / 2]],
            offsetX = (baseWidth - CRSWidth) / 2,
            offsetY = (baseHeight - CRSHeight) / 2;


        var bounds = [[0, 0], [baseHeight, baseWidth]];

        var tileLayer = L.tileLayer(tileTemplate,
            {
                foo: 'bar',
                subdomains: cdnSubdomains,
                minZoom: -6,
                maxZoom: 0,
                maxNativeZoom: 0,
                minNativeZoom: -6
            }
        );

        var map = L.map('map', {
            attributionControl: false, // cache l’attribution Leaflet
            crs: L.CRS.Simple, // Coordinate Reference System
            //worldCopyJump: true,
            maxBounds: maxBounds,
            minZoom: minZoom,
            maxZoom: 0,
            layers: [tileLayer]
        });

        map.setMaxBounds(maxBounds)

        map.fitBounds(maxBounds);

    }
    //
    // 13708,7590
    //

})