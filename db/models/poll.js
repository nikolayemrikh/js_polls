/**
 * Модель комнаты (сеанса)
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var User = require('./user').schema;
var Poll = new Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    date: {
        type: Date,
        required: true
    },
    creator: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    /*answers: [{
        type: Schema.Types.ObjectId,
        ref: 'Answer'
    }]*/
    answers: [{
        text: {
            type: String,
            required: true
        },
        assignedUsers: [{
            type: Schema.Types.ObjectId,
            ref: 'User'
        }]
    }]
});
/*Poll.set('toJSON', {
    virtuals: true,
    getters: true,
    transform: function(doc, ret, options) {
        delete ret._id;
        return ret;
    }
});*/
var collectionName = 'polls';
module.exports = mongoose.model('Poll', Poll, collectionName);