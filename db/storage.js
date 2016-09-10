var fs = require('fs');
var path = require('path');
var config = require('nconf');
var db = require('./index');

var dao = {
    /**
     * Загрузить файлы в GridFS.
     * 
     * @param {Object[]} files - Список загруженных на сервер файлов.
     * @param {function} callback()
     */
    upload: function(files, callback) {
        files = files || [];
        if (!callback) callback = function() {};
        var amount = files.length;
        if (!amount) return callback();
        var attach = [];
        var next = function(data) {
            if (data) attach.push(data);
            if (--amount < 1) callback(attach);
        };
        var tmpdir = config.get('uploads:tmpdir');
        files.forEach(function(file) {
            // Если уже был загружен ранее
            if (file.uploadDate) return next(file);
            var fullname = path.join(tmpdir, path.basename(file.filename));
            fs.exists(fullname, function(exists) {
                if (!exists) return next();
                var writestream = db.gfs.createWriteStream({
                    filename: file.originalname,
                    content_type: file.mimetype
                });
                fs.createReadStream(fullname).pipe(writestream);
                writestream.on('close', function(data) {
                    fs.unlink(fullname);
                    data.id = data._id;
                    delete data._id;
                    next(data);
                });
            });
        });
    },
    /**
     * Скачать файл по его идентификатору.
     * 
     * @param {ObjectId} fileId - Идентификатор файла в GridFS.
     * @param {function} callback(data)
     */
    download: function(fileId, callback) {
        db.gfs.findOne({
            _id: fileId
        }, function(err, data) {
            if (!err && data) {
                var readstream = db.gfs.createReadStream({
                    _id: fileId
                });
                readstream.pipe(callback(data));
            }
            else callback();
        });
    },
    /**
     * Удалить файлы из GridFS.
     * 
     * @param {Object[]} files - Список файлов для удаления.
     * @param {ObjectId} files[].fileId - Идентификатор файла.
     * @param {function} callback()
     */
    remove: function(files, callback) {
        files = files || [];
        if (!callback) callback = function() {};
        var amount = files.length;
        if (!amount) return callback();
        var next = function() {
            if (--amount < 1) callback();
        };
        files.forEach(function(file) {
            db.gfs.remove({
                _id: file.id
            }, next);
        });
    }
};

module.exports = dao;