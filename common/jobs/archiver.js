var config = require('nconf');
var spawn = require('child_process').spawn;

var Room = require('../../db').model('room');

var interval = config.get("archiver:interval");
var env = Object.create(process.env);
// environment variables
env.STORAGE_DIR = config.get("archiver:storage") || '';
env.FRAME_RATE = config.get("archiver:fps") || '';
env.LOG_LEVEL = config.get("archiver:log") || '';
// external storage
env.STORAGE_URL = config.get("storage:uri") || '';
env.STORAGE_USER = config.get("storage:username") || '';
env.STORAGE_PASS = config.get("storage:password") || '';

module.exports = function(agenda) {
    agenda.define('archiverThread', {
        concurrency: config.get("archiver:threads") || 1
    }, function(job, done) {
        var roomId = job.attrs.data.id;
        var archiver = spawn('./archiver.sh', [roomId], {
            env: env
        });
        archiver.stdout.on('data', function(data) {
            console.log(data.toString('utf8'));
        });
        archiver.stderr.on('data', function(data) {
            console.log(data.toString('utf8'));
        });
        archiver.on('close', function(code) {
            if (code !== 0) return done(code);
            Room.findByIdAndUpdate(roomId, {
                archived: true
            }, function(err) {
                if (err) return done(err);
                done();
            });
        });
        archiver.on('error', function(err) {
            done(err);
        });
    });

    agenda.define('videoArchiver', function(job, done) {
        Room.find({
            record: true,
            stopDate: {
                '$ne': null
            },
            archived: {
                '$ne': true
            }
        }).exec(function(err, data) {
            if (err) return done(err);
            for (var i = 0, l = data.length; i < l; i++) {
                var job = agenda.create('archiverThread', {
                    // поле output отображается в таблице администратора
                    output: data[i].id,
                    id: data[i].id
                });
                job.schedule(new Date());
                job.unique({
                    'data.id': data[i].id
                }, {
                    insertOnly: true
                });
                job.save();
            }
            done();
        });
    });

    if (interval) {
        agenda.on('ready', function() {
            agenda.every(interval + ' minutes', 'videoArchiver');
        });
    }
};