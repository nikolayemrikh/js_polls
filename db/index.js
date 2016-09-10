var logger = require('../common/logger');
var mongoose = require('mongoose');
var config = require('nconf');
mongoose.connect(config.get('mongodb:uri'));
var conn = mongoose.connection;
var Grid = require('gridfs-stream');

var db = {
    mongoose: mongoose,
    gfs: null,
    dao: function(dao) {
        return require('./' + dao);
    },
    model: function(model) {
        return require('./models/' + model);
    }
};

conn.on('error', function(err) {
    logger.error("MongoDB connection error: " + err.message);
});
conn.once('open', function() {
    logger.info("MongoDb is connected");
    db.gfs = Grid(conn.db, mongoose.mongo);
});

module.exports = db;