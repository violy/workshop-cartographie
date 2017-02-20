var config = require('./server-config.json');
var TILE_SIZE = config.TILE_SIZE,
    cacheRoot = config.cacheRoot,
    uploadRoot = config.uploadRoot,
    emptyTileSrc = config.emptyTileSrc,
    sourceFile = config.sourceFile,
    _SHA_HASH_ = config.SHA_HASH;

var express = require('express'),
    bodyParser = require('body-parser'),
    multer = require('multer'),
    upload = multer(); // for parsing multipart/form-data

var fs = require('fs'),
    mkdirp = require('mkdirp');

var sha1 = require('sha1');

var imageSize = require('image-size');
var Canvas = require('canvas'),
    Image = Canvas.Image;
var app = express();
var port = config.port;


var imageOriginSrc, // référence unique
    imageOrigin; // référence unique utilisée comme pseudo-cache

// génère une image vide et la met en cache
mkdirp(cacheRoot, function (err) {
    var canvas = new Canvas(TILE_SIZE, TILE_SIZE),
        ctx = canvas.getContext('2d');
    fs.writeFile(cacheRoot + emptyTileSrc, canvas.toBuffer(),function(){
        console.log('Done. empty.png')
    });
});

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.use(express.static('public'));
app.use('/new',express.static('public/new.html'));

app.post('/upload', upload.single('upload'), function(req,res){
    console.log(req.body);
    console.log(req.file);
    var imageType = false,
        originalname = req.file.originalname,
        imageUid = sha1(originalname+_SHA_HASH_),
        imageDir = uploadRoot+imageUid+'/';
    switch(req.file.mimetype.toLowerCase()){
        case 'image/jpeg':
            imageType = 'jpg';
            break;
        case 'image/png':
            imageType = 'png';
            break;
    }
    if(imageType && req.file.buffer.length>0){
        mkdirp(imageDir,function(err){
            if(err) throw err;
            var filePath = imageDir+'layer0.'+imageType,
                metaPath = imageDir+'metadata.json';

            fs.writeFile(filePath,req.file.buffer,function(err){
                if(err) throw err;
                var metaData = imageSize(filePath);
                    metaData.originalname = originalname;
                    metaData.mimetype = req.file.mimetype;
                    metaData.size = req.file.size;
                    metaData.encoding = req.file.encoding;
                    metaData.author = req.body.author;
                    metaData.title = req.body.title;
                    metaData.dateadd= new Date();
                metaData.uid = imageUid;
                fs.writeFile(metaPath,JSON.stringify(metaData),function(err){
                    res.json(metaData);
                })
            });
        });
    }
});

app.use('/tile/empty.png',express.static(__dirname+'/'+cacheRoot+emptyTileSrc));

app.get('/tile/:n/:z/:x/:y', function (req, res) {
    console.log(req.params);
    var x = parseFloat(req.params.x),
        y = parseFloat(req.params.y),
        z = parseFloat(req.params.z);

    var fileName = sourceFile,
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
        contain = offsetX > -scaledTile && offsetX<srcSize.width && offsetY > -scaledTile && offsetY<srcSize.height,
        border = contain && (offsetX < 0 || offsetX > srcSize.width || offsetY < 0 || offsetY > srcSize.height);

    console.log(offsetX,offsetY,srcSize,scaledTile);
    console.log(offsetX > -scaledTile , offsetX<srcSize.width , offsetY > -scaledTile , offsetY<srcSize.height);
    console.log("contain %s, border %s",contain,border);

    function EndImage(canvas,filePath,dirPath){
        canvas.toBuffer(function (err, buf) {
            if (err) throw err;
            res.writeHead(200, {
                'Content-Type': 'image/png',
                'Content-Length': buf.length
            });
            if(buf.length == 0){return res.status(500).end()};
            res.end(buf);
            // écrit le fichier en local
            mkdirp(dirPath, function (err) {
                if (err) throw err;
                fs.writeFile(filePath, buf, function (err) {
                    if (err) throw err;
                    console.log('Done. %s', filePath);
                });
            })
        });

    }

    if(contain) {
        res.sendFile(cacheFilePath, {maxAge: '1d', root: __dirname}, function (err) {
            if (err) {
                //console.log('cache not exists', cacheFilePath);
                try {

                    var canvas = new Canvas(TILE_SIZE, TILE_SIZE),
                    ctx = canvas.getContext('2d'),
                    imgSrc,
                    img = new Image();

                    if (imageOriginSrc != fileName) {
                        imageOriginSrc = fileName;
                        imageOrigin = fs.readFileSync(srcFilePath);
                    }
                    imgSrc = imageOrigin;

                    img.src = imgSrc;

                    //console.log('x %s y %s z %s scale %s maxZoom %s', x, y, z, scale, maxZoom);
                    //console.log('Tile ', fileName, img.width, img.height);
                    // now, lets draw the tile

                        ctx.drawImage(img, offsetX, offsetY, TILE_SIZE * scale, TILE_SIZE * scale, 0, 0, TILE_SIZE, TILE_SIZE);
                        // and transform it into a binary buffer, so we can
                        // deliver it to the client
                        EndImage(canvas, cacheFilePath, cachePath);
                }catch(err){
                    console.log(err);
                    res.status(500).end();
                }
            }
        });
    }else{
        res.sendFile(cacheRoot+emptyTileSrc,{maxAge: '1d', root: __dirname},function(err){
            if (err) res.status(500).end();
        });
    }

});

app.listen(port, function () {
    console.log('Example app listening on port %s!', port);
});