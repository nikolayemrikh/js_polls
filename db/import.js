if (process.argv.length !== 3) {
    console.error('Usage: node import.js <users.json>');
    process.exit(1);
}

var path = require('path');
var config = require('nconf').file('config.json');
var db = require('./index');
var mongoose = db.mongoose;
var conn = mongoose.connection;

conn.once('open', function() {
    console.info("Importing users from: " + process.argv[2]);
    var data = require(path.join(__dirname, process.argv[2]));
    importer.go(data, function() {
        mongoose.disconnect();
        console.log('done');
        process.exit(0);
    });
});

var importer = {
    next: function(callback) {
        if (!this.iterator) this.iterator = 0;
        if (arguments.length === 0) this.iterator++;
        else {
            this.iterator--;
            if (this.iterator <= 0) {
                process.stdout.write("\n");
                callback();
            }
        }
        process.stdout.write(".");
    },
    go: function(data, callback) {
        var User = require('./models/user');
        data.forEach(function(item) {
            importer.next();
            User.create(item, function(err, user) {
                if (err) console.log(err);
                importer.next(callback);
            });
        });
    }
};
