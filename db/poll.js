var config = require('nconf');
var User = require('./models/user');
var Poll = require('./models/poll');
//var Answer = require('./models/answer');
module.exports = {
    add: function(args, callback) {
        var poll = new Poll({
            name: args.data.name,
            description: args.data.description,
            date: args.data.date || new Date(),
            creator: args.data.creator,
            answers: args.data.answers
        });
        poll.save(function(err, poll, numAffected) {
            if (err) return callback(err);
            callback(err, poll);
        });
    },
    list: function(args, callback) {
        Poll.find({}).populate('creator', 'username firstname lastname').exec(callback);
    },
    get: function(args, callback) {
        console.log(args)
        Poll.findById(args.id).populate('creator', 'username firstname lastname').exec(callback);
    },
    update: function(args, callback) {
        var data = args.data || {};
        Poll.findByIdAndUpdate(args.id, {
            '$set': data
        }, {
            'new': true
        }, function(err, poll) {
            callback(err, poll);
            //task.save();
        });
    },
    delete: function(args, callback) {
        Poll.findByIdAndRemove(args.id, null, callback);
    }
}