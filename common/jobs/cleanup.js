var config = require('nconf');
var fs = require('fs');

// Временная директория загрузки файлов
var tmpdir = config.get("uploads:tmpdir");
// Очищать файлы старше cleanup в минутах
var cleanup = config.get("uploads:cleanup");

module.exports = function(agenda) {
    agenda.define('cleanUploads', function(job, done) {
        if (!tmpdir) return done();
        fs.readdir(tmpdir, function(err, files) {
            if (err) return done(err);
            if (files.length > 0) {
                for (var i = 0; i < files.length; i++) {
                    var filePath = tmpdir + '/' + files[i];
                    fs.stat(filePath, function(err, stats) {
                        if (!err && !stats.isFile()) return;
                        var ctime = new Date(stats.ctime);
                        var now = new Date();
                        if (now - ctime > cleanup * 60 * 1000) fs.unlink(filePath);
                    });
                }
            }
            done();
        });
    });

    if (cleanup) {
        agenda.on('ready', function() {
            agenda.every(cleanup + ' minutes', 'cleanUploads');
        });
    }
};