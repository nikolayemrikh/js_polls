var express = require('express');
var router = express.Router();
var config = require('nconf');
var request = require('request');
var url = require('url');
var fs = require('fs');

// Video stream
router.get('/:fileName', function(req, res, next) {
    var uri = url.resolve(config.get("storage:uri"), req.params.fileName);
    if (url.parse(uri).hostname) {
        request.get(uri, {
                'timeout': config.get("storage:timeout"),
                //'headers': req.headers,
                'headers': {
                    'Range': req.headers['range']
                },
                'auth': {
                    'user': config.get("storage:username"),
                    'pass': config.get("storage:password"),
                    'sendImmediately': false
                }
            }).on('error', function(err) {
                res.status(404).end();
            })
            .on('response', function(response) {
                //res.set(response.headers);
                res.set({
                    'Content-Type': 'video/webm',
                    'Content-Length': response.headers['content-length'],
                    'Accept-Ranges': response.headers['accept-ranges'],
                    'Content-Range': response.headers['content-range']
                });
                res.status(response.statusCode);
                response.pipe(res);
            });
    }
    else {
        fs.stat(uri, function(err, stats) {
            if (!err && stats.isFile()) {
                var total = stats.size;
                if (req.headers['range']) {
                    var range = req.headers.range;
                    var positions = range.replace(/bytes=/, "").split("-");
                    var start = parseInt(positions[0], 10);
                    var end = positions[1] ? parseInt(positions[1], 10) : total - 1;
                    var chunksize = (end - start) + 1;
                    res.writeHead(206, {
                        "Content-Range": "bytes " + start + "-" + end + "/" + total,
                        "Accept-Ranges": "bytes",
                        "Content-Length": chunksize,
                        "Content-Type": "video/webm"
                    });
                    var stream = fs.createReadStream(uri, {
                            start: start,
                            end: end
                        })
                        .on("open", function() {
                            stream.pipe(res);
                        }).on("error", function(err) {
                            res.end(err);
                        });
                }
                else {
                    res.writeHead(200, {
                        'Content-Length': total,
                        'Content-Type': 'video/webm'
                    });
                    fs.createReadStream(uri).pipe(res);
                }
            } else {
                res.status(404).end();
            }
        });
    }
});

module.exports = router;
