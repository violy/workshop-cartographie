var config = require('./server-config.json');
var TILE_SIZE = config.TILE_SIZE,
    cacheRoot = config.cacheRoot,
    uploadRoot = config.uploadRoot,
    emptyTileSrc = config.emptyTileSrc,
    sourceFile = config.sourceFile,
    _SHA_HASH_ = config.SHA_HASH;

var _ = require('underscore');

var express = require('express'),
    bodyParser = require('body-parser'),
    multer = require('multer'),
    upload = multer(); // for parsing multipart/form-data

var fs = require('fs'),
    mkdirp = require('mkdirp');

var handlebars = require('handlebars'),
    layout = handlebars.compile(fs.readFileSync('public/layout.hbs','utf-8')),
    layoutDefaultOptions = {
        title:'Arthur Violy - 2017 - Académie Charpentier',
        content:'...',
        js:['main']
    };

handlebars.registerHelper('times', function(n, context, block) {
    var accum = '';
    for(var i = 0; i < n; ++i)
        accum += block.fn(_(context).extend({index:i}));
    return accum;
});

handlebars.registerHelper('filesize', function(bytes) {
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes == 0) return '0 Bytes';
    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return (bytes / Math.pow(1024, i)).toFixed(2) + sizes[i];
});
handlebars.registerHelper("zoomScale", function(zoom,block) {
    console.log(this);
    return block.fn(Math.pow(2,zoom));
});
handlebars.registerHelper("math", function(lvalue, operator, rvalue) {
    lvalue = parseFloat(lvalue);
    rvalue = parseFloat(rvalue);

    return {
        "+": lvalue + rvalue,
        "-": lvalue - rvalue,
        "*": lvalue * rvalue,
        "/": lvalue / rvalue,
        "%": lvalue % rvalue
    }[operator];
});

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

function MaxZoom(width,height){
    return Math.round(Math.max(Math.sqrt(width/TILE_SIZE), Math.sqrt(height/TILE_SIZE))-1)
}

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.use(express.static('public'));
app.use('/new',express.static('public/new.html'));
app.use('/thumbs',express.static('uploads'));

app.post('/upload', upload.single('upload'), function(req,res){

    if(!req.file){
        return res.status(401).json({error:'please select a file'});
    }

    var imageType = false,
        originalname = req.file.originalname,
        imageUid = sha1(originalname+(new Date().getTime())+_SHA_HASH_),
        imageDir = uploadRoot+imageUid+'/';
    switch(req.file.mimetype.toLowerCase()){
        case 'image/jpeg':
            imageType = 'jpg';
            break;
        case 'image/png':
            imageType = 'png';
            break;
        default :
            res.status(401).json({status:'ERROR',error:'wrong mimetype '+req.file.mimetype});
            return;
    }
    if(imageType && req.file.buffer.length>0){
        mkdirp(imageDir,function(err){
            if(err) throw err;
            var filePath = imageDir+'layer0.'+imageType,
                metaPath = imageDir+'metadata.json';
            //
            mkdirp(imageDir+cacheRoot,function (err) {});
            fs.writeFile(filePath,req.file.buffer,function(err){
                if(err) throw err;
                var metaData = imageSize(filePath),
                    width = metaData.width,
                    height = metaData.height,
                    minZoom = MaxZoom(width,height);
                    metaData.originalname = originalname;
                    metaData.mimetype = req.file.mimetype;
                    metaData.size = req.file.size;
                    metaData.encoding = req.file.encoding;
                    metaData.author = req.body.author;
                    metaData.title = req.body.title;
                    metaData.dateadd= new Date();
                    metaData.uid = imageUid;
                    metaData.minZoom = minZoom;
                console.log('image uploaded',imageUid)

                fs.writeFile(metaPath,JSON.stringify(metaData),function(err){
                    if(err) throw err;
                    console.log('metadata ok',imageUid)
                    res.json(metaData).end();
                });
            });
        });
    }
});

app.post('/build-zoom/:uid',function(req,res){
    var imageUid = req.params.uid,
        imageDir = uploadRoot+imageUid+'/',
        metaPath = imageDir+'metadata.json',
        metaData = JSON.parse(fs.readFileSync(metaPath)),
        imageType = metaData.type,
        width = metaData.width,
        height = metaData.height,
        filePath = imageDir+'layer0.'+imageType,
        img = new Image();

    fs.readFile(filePath,function(err,buf){
        img.src = buf;
        console.log('readFile',filePath);
        var zoom = 1;
        function BuildZoom(callback){
            var fileLayerPath = imageDir+'layer'+zoom+'.'+imageType,
                scale = Math.pow(2,zoom),
                sWidth = width/scale,
                sHeight = height/scale,
                canvas = new Canvas(sWidth,sHeight),
                ctx = canvas.getContext('2d');

                ctx.drawImage(img,0,0,width,height,0,0,sWidth,sHeight);
            canvas.toBuffer(function(err,buf){
                fs.writeFile(fileLayerPath, buf, function (err) {
                    if (err) throw err;
                    console.log("zoom %s -> scale %s done",zoom,scale,fileLayerPath);
                    if(zoom>metaData.minZoom){
                        callback();
                    }else{
                        zoom++;
                        BuildZoom(callback);
                    }
                });
            });
        }

        function BuildThumbnail(callback){
            var thumbFilePath = imageDir+'thumb.'+imageType,
                scale = Math.max(width/TILE_SIZE,height/TILE_SIZE),
                sWidth = width/scale,
                sHeight = height/scale,
                canvas = new Canvas(TILE_SIZE,TILE_SIZE),
                ctx = canvas.getContext('2d'),
                offsetX = (TILE_SIZE-sWidth)/2,
                offsetY = (TILE_SIZE-sHeight)/2,
                out,stream;

            ctx.drawImage(img,0,0,width,height,offsetX,offsetY,sWidth,sHeight);
            out = fs.createWriteStream(thumbFilePath);
            stream = canvas.pngStream();
            stream.on('data',function(chunk){
                out.write(chunk);
            });
            stream.on('end', function(){
                callback();
            });
        }

        BuildZoom(function(){BuildThumbnail(function(){
            console.log('Zoom builded');
            res.json({status:'OK'});
        })});

    })

});

app.get('/build-cache/:uid/:zoom',function(req,res){
   var imageUid = req.params.uid,
       zoom = parseInt(req.params.zoom),
       scale = Math.pow(2,zoom),
       imageDir = uploadRoot+imageUid+'/',
       metaPath = imageDir+'metadata.json',
       metaData = JSON.parse(fs.readFileSync(metaPath)),
       imageType = metaData.type,
       width = metaData.width,
       height = metaData.height,
       filePath = imageDir+'layer'+zoom+'.'+imageType,
       xMaxAbs = Math.ceil(width/scale/TILE_SIZE/2),
       yMaxAbs = Math.ceil(height/scale/TILE_SIZE/2),
       img = new Image();

    fs.readFile(filePath,function(err,buf) {
        img.src = buf;
        console.log('readFile', filePath);
        var x = -xMaxAbs;
        var y = -yMaxAbs,
            offsetX = width/scale/2,
            offsetY = height/scale/2;
        function DrawNextTile(callback){
            var z = -zoom,
                canvas = new Canvas(TILE_SIZE,TILE_SIZE),
                ctx = canvas.getContext('2d'),
                cacheDirPath = imageDir+cacheRoot+z+'/'+x+'/'+y+'/',
                cacheFilePath = cacheDirPath+imageUid+'.'+imageType,
                stream, out;
            mkdirp(cacheDirPath,function(err){
                console.log('x %s y %s',x,y);
                ctx.clearRect(0,0,TILE_SIZE,TILE_SIZE);
                ctx.drawImage(img,offsetX+x*TILE_SIZE,offsetY+y*TILE_SIZE,TILE_SIZE,TILE_SIZE,0,0,TILE_SIZE,TILE_SIZE);
                out = fs.createWriteStream(cacheFilePath);
                stream = canvas.pngStream();
                stream.on('data',function(chunk){
                    out.write(chunk);
                });
                stream.on('end', function(){
                    console.log('saved png',x,y);
                });
                if(x<xMaxAbs){
                    x++;
                }else if(y<yMaxAbs){
                    x = -xMaxAbs;
                    y++;
                }else{
                    return callback();
                }
                DrawNextTile(callback);
            })

        }
        DrawNextTile(function(){
            res.json({xMaxAbs:xMaxAbs,yMaxAbs:yMaxAbs,scale:scale}).end();
        });
    });
});

app.use('/map/:uid',function(req,res, next){
    var uid = req.params.uid;
    fs.exists(uploadRoot+uid,function(exists){
        console.log(uploadRoot+uid,exists)
        if(exists){
            next();
        }else{
            res.status(404).end('carte introuvable...');
        }
    });
}).use('/map/:uid',express.static('public/map.html'));

app.use('/meta/:uid',function(req,res,next){
    var uid = req.params.uid,
        filePath = uploadRoot+uid+'/metadata.json';
    fs.exists(filePath,function(exists){
        console.log(filePath,exists)
        if(exists){
            fs.readFile(filePath,function(err,buffer){
                res.type('json').end(buffer);
                next();
            });
        }else{
            res.status(404).end('carte introuvable...');
        }
    });
})

app.use('/tools/:uid',function(req,res,next){
    var uid = req.params.uid,
        filePath = uploadRoot+uid+'/metadata.json';
    fs.exists(filePath,function(exists){
        console.log(filePath,exists)
        if(exists){
            fs.readFile(filePath,function(err,buffer){
                var meta = JSON.parse(buffer),
                    toolsTemplate = handlebars.compile(fs.readFileSync('public/tools.hbs','utf-8'));

                meta.maxZoom = meta.minZoom + 2;

                var content = toolsTemplate(meta);

                res.end(layout(_.extend(layoutDefaultOptions,{js:['tools'],title:'édition de la carte '+meta.title+' - '+meta.author,content:content})));
                next();
            });
        }else{
            res.status(404).end('carte introuvable...');
        }
    });
})

app.get('/maps',function(req,res){
   fs.readdir(uploadRoot,function(err,files){
       var output = '<h1>Liste des cartes</h1><ul class="map-list">';
       files.forEach(function(filename){
           if(filename.length==40 || filename == 'default'){
               output += '<li class="item" data-uid="'+filename+'"><a href="/map/'+filename+'"><img src="thumbs/'+filename+'/thumb.jpg" alt="'+filename+'"></a><a href="tools/'+filename+'" class="tools">Editer</a></li>';
           }
       });
       output += '<ul>'
       res.type('html')
           .header( "expire","-1")
           .header( "Pragma","no-cache")
           .header( "Cache-control","no-cache")
           .end(layout(_.extend(layoutDefaultOptions,{title:'liste des cartes',content:output,js:[]})));

   })
});

app.use('/tile/empty.png',express.static(__dirname+'/'+cacheRoot+emptyTileSrc));

app.get('/tile/:n/:z/:x/:y/:uid', function (req, res) {
    console.log(req.params);
    var x = parseFloat(req.params.x),
        y = parseFloat(req.params.y),
        z = parseFloat(req.params.z),
        uid = req.params.uid;

    var basePath = uploadRoot+uid+'/',
        meta = require('./'+basePath+'metadata.json'),
        nZ = -z, // negative zoom
        minZoom = meta.minZoom,
        nZmin = Math.min(nZ,minZoom),
        nZScale = Math.pow(2,nZmin),
        nZDiffScale = Math.pow(2,nZmin-nZ),
        fileName = 'layer'+nZmin+'.jpg',
        srcPath = basePath,
        srcFilePath = srcPath+fileName,
        cachePath = basePath+cacheRoot + z + '/' + x + '/' + y + '/',
        cacheFilePath = cachePath+uid+'.jpg',
        srcSize = imageSize(srcFilePath),
        maxZoom = MaxZoom(srcSize.width,srcSize.height),
        scale = Math.pow(2,nZ),
        layerWidth = Math.round(meta.width/nZScale),
        layerHeight = Math.round(meta.height/nZScale),
        centerX = Math.round(layerWidth/2),
        centerY = Math.round(layerHeight/2),
        scaledTile =  TILE_SIZE/nZDiffScale,
        offsetX = (x) * scaledTile + centerX,
        offsetY = (y) * scaledTile + centerY,
        contain = offsetX > -scaledTile && offsetX<layerWidth && offsetY > -scaledTile && offsetY<layerHeight,
        border = contain && (offsetX < 0 || offsetX > layerWidth-scaledTile || offsetY < 0 || offsetY > layerHeight-scaledTile);


    function EndImage(canvas,filePath,dirPath){
        console.log('dirPath',dirPath)
        mkdirp(dirPath, function (err) {
            if (err) throw err;
            canvas.toBuffer(function (err, buf) {
                if (err) throw err;
                res.writeHead(200, {
                    'Content-Type': 'image/png',
                    'Content-Length': buf.length
                });
                if (buf.length == 0) {
                    return res.status(500).end()
                }
                ;
                res.end(buf);
                // écrit le fichier en local
                fs.writeFile(filePath, buf, function (err) {
                    if (err) throw err;
                    console.log('Done. %s', filePath);
                });
            });
        });


    }

    if(contain) {
        res.sendFile(cacheFilePath, {maxAge: '1d', root: __dirname}, function (err) {
            if (err) {
                try {

                    var canvas = new Canvas(TILE_SIZE, TILE_SIZE),
                    ctx = canvas.getContext('2d'),
                    imgSrc,
                    img = new Image();

                    if (imageOriginSrc != srcFilePath) {
                        imageOriginSrc = srcFilePath;
                        imageOrigin = fs.readFileSync(srcFilePath);
                    }
                    imgSrc = imageOrigin;

                    img.src = imgSrc;

                    //console.log('x %s y %s z %s scale %s maxZoom %s', x, y, z, scale, maxZoom);
                    //console.log('Tile ', fileName, img.width, img.height);
                    // now, lets draw the tile

                    ctx.drawImage(img, offsetX, offsetY, scaledTile, scaledTile, 0, 0, TILE_SIZE, TILE_SIZE);
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