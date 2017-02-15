var express = require('express');
var fs = require('fs');
var mkdirp = require('mkdirp');
var imageSize = require('image-size');
var Canvas = require('canvas'),
    Image = Canvas.Image;
var config = require('./server-config.json');
var app = express();
var port = config.port;

var TILE_SIZE = config.TILE_SIZE,
    cacheRoot = config.cacheRoot,
    emptyTileSrc = config.emptyTileSrc;

var imageOriginSrc, // référence unique
    imageOrigin; // référence unique utilisée comme pseudo-cache

app.use(express.static('public'));

app.use('/tile/empty.png',express.static(__dirname+'/'+cacheRoot+emptyTileSrc));

app.get('/tile/:z/:x/:y', function (req, res) {
    console.log(req.params);
    var x = parseFloat(req.params.x),
        y = parseFloat(req.params.y),
        z = parseFloat(req.params.z);

    var fileName = 'Waldseemuller_map_2.jpg',
        srcPath = 'images/',
        srcFilePath = srcPath+fileName,
        cachePath = cacheRoot + z + '/' + x + '/' + y + '/',
        cacheFilePath = cachePath+fileName,
        srcSize = imageSize(srcFilePath),
        maxZoom = Math.round(Math.max(Math.sqrt(srcSize.width/TILE_SIZE), Math.sqrt(srcSize.height/TILE_SIZE))-1),
        scale = Math.pow(2,-z),
        centerX = srcSize.width/2,
        centerY = srcSize.height/2,
        scaledTile = scale * TILE_SIZE,
        offsetX = (x) * scaledTile + centerX,
        offsetY = (y) * scaledTile + centerY,
        contain = offsetX > -scaledTile && offsetX<srcSize.width && offsetY > -scaledTile && offsetY<srcSize.height;

    console.log(offsetX > -scaledTile , offsetX<srcSize.width , offsetY > -scaledTile , offsetY<srcSize.height);

    function EndImage(canvas,filePath,dirPath){
        canvas.toBuffer(function (err, buf) {
            if (err) throw err;
            res.writeHead(200, {
                'Content-Type': 'image/png',
                'Content-Length': buf.length
            });
            res.end(buf);
            // écrit le fichier en local
            console.log('write file %s ...', filePath);
            mkdirp(dirPath, function (err) {
                if (err) throw err;
                console.log('directory %s is Ok.', dirPath);
                fs.writeFile(filePath, buf, function (err) {
                    if (err) throw err;
                    console.log('cache file done. %s', filePath);
                });
            })
        });

    }

    if(contain) {
        res.sendFile(cacheFilePath, {maxAge: '1d', root: __dirname}, function (err) {
            if (err) {
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

                console.log('x %s y %s z %s scale %s maxZoom %s', x, y, z, scale, maxZoom);
                console.log('Tile ', fileName, img.width, img.height);
                // now, lets draw the tile
                ctx.drawImage(img, offsetX, offsetY, TILE_SIZE * scale, TILE_SIZE * scale, 0, 0, TILE_SIZE, TILE_SIZE);
                // and transform it into a binary buffer, so we can
                // deliver it to the client
                EndImage(canvas,cacheFilePath,cachePath);
            }
        });
    }else{
        res.sendFile(cacheRoot+emptyTileSrc,{maxAge: '1d', root: __dirname},function(err){
            if (err) throw err;
        });
    }

});

app.listen(port, function () {
    console.log('Example app listening on port %s!', port);
});