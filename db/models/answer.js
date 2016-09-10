/**
 * Модель комнаты (сеанса)
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Answer = require('./answer').schema;
var Room = new Schema({
    text: {
        type: String,
        required: true
    },
    assignedUsers: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }]
}, {
    timestamps: true
});
Room.set('toJSON', {
    virtuals: true,
    getters: true,
    transform: function(doc, ret, options) {
        delete ret._id;
        return ret;
    }
});
module.exports = mongoose.model('Answer', Answer);