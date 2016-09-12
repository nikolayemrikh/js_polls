var config = require('nconf');
var User = require('./models/user');
var Poll = require('./models/poll');
//var Answer = require('./models/answer');
module.exports = {
    add: function(args, callback) {
        console.log(args.data)
        var poll = new Poll({
            name: args.data.name,
            description: args.data.description,
            date: args.data.date || new Date().toJSON(),
            creator: args.data.creator,
            answers: args.data.answers
        });
        poll.save(function(err, poll, numAffected) {
            if (err) return callback(err);
            callback(err, poll);
        });
    },
    list: function(args, callback) {
        //Poll.find({}).populate('creator', 'username firstname lastname').populate({path: 'answers.assignedUsers', select: 'username firstname lastname'}).exec(callback);
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
    },
    assignUser: function(args, callback) {
        Poll.findById(args.id, function(err, poll) {
            if (err || !poll) return callback(err);
            if (poll.answers) {
                poll.answers = poll.answers.map(function(elem) {
                    //if (elem.text == args.data.text && elem.assignedUsers.indexOf(args.data.userToAssign) == -1) {
                        elem.assignedUsers.push(args.data.userToAssign);
                    //}
                    return elem;
                });
                console.log(poll)
                poll.save(callback);
            }
            else {
                var err = new Error("No asnwers array")
                callback(err);
            }
        });
    }
}