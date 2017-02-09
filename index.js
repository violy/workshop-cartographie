var express = require('express');
var fs = require('fs');
var mkdirp = require('mkdirp');
var Canvas = require('canvas'),
    Image = Canvas.Image;
var app = express();
var port = 3333;

var TILE_SIZE = 256;

var imageOriginSrc, // référence unique
    imageOrigin; // référence unique utilisée comme pseudo-cache

app.use(express.static('public'));

app.get('/tile/:z/:x/:y', function (req, res) {
    console.log(req.params);
    var x = parseFloat(req.params.x),
        y = parseFloat(req.params.y),
        z = parseFloat(req.params.z);

    var fileName = 'Waldseemuller_map_2.jpg',
        srcPath = 'images/',
        srcFilePath = srcPath+fileName,
        cachePath = '.cache/' + z + '/' + x + '/' + y + '/',
        cacheFilePath = cachePath+fileName;

    function EndImage(buf){
        res.writeHead(200, {
            'Content-Type': 'image/png',
            'Content-Length': buf.length
        });
        res.end(buf);
    }

    fs.exists(cacheFilePath, function (exists) {
        if (exists) {
            console.log('file exists', cacheFilePath);
            fs.readFile(cacheFilePath,function(err,buf){
                if(err) throw err;
                EndImage(buf);
            });
        } else {
            console.log('cache not exists', cacheFilePath);
            var canvas = new Canvas(TILE_SIZE, TILE_SIZE),
                ctx = canvas.getContext('2d'),
                imgSrc,
                img = new Image();

            if (imageOriginSrc != fileName) {
                console.log('imageOrigin source --> %s', fileName);
                imageOriginSrc = fileName;
                imageOrigin = fs.readFileSync(srcFilePath);
            }
            imgSrc = imageOrigin;

            img.src = imgSrc;
            var maxZoom = Math.round(Math.max(Math.sqrt(img.width/TILE_SIZE), Math.sqrt(img.height/TILE_SIZE))-1),
                scale = Math.pow(2,maxZoom-z),
                centerOffsetX = img.width/2,
                centerOffsetY = img.height/2;

            console.log('x %s y %s z %s scale %s maxZoom %s', x, y, z, scale, maxZoom);
                console.log('Tile ', fileName, img.width, img.height);
                // now, lets draw the tile
                ctx.drawImage(img, ((x-.5) * scale * TILE_SIZE) + centerOffsetX, ((y-.5) * scale * TILE_SIZE) + centerOffsetY, TILE_SIZE*scale, TILE_SIZE*scale,0,0, TILE_SIZE, TILE_SIZE);
                // and transform it into a binary buffer, so we can
                // deliver it to the client
                canvas.toBuffer(function (err, buf) {
                    if (err) throw err;
                    EndImage(buf);
                    // écrit le fichier en local
                    console.log('write file %s ...',cacheFilePath);
                    mkdirp(cachePath,function(err){
                        if(err) throw err;
                        console.log('directory %s is Ok.',cachePath);
                        fs.writeFile(cacheFilePath, buf, function (err) {
                            if (err) throw err;
                            console.log('cache builded');
                        });
                    })
                });

        }
    });

});

app.listen(port, function () {
    console.log('Example app listening on port %s!', port);
});