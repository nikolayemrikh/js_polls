/**
 * Модель сообщений
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var storage = require('../storage');
var User = require('./user').schema;
var Chat = new Schema({
    // Идентификатор комнаты (связь N:1)
    room: {
        type: Schema.Types.ObjectId,
        required: true
    },
    // Автор сообщения
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true  
    },
    // Текст сообщения
    message: {
        type: String
    },
    // Ссылка на вложение
    attach: []
}, {
    timestamps: true
});
Chat.pre('save', function(next) {
    var self = this;
    storage.upload(this.attach, function(attach){
        self.attach = attach;
        next();
    });
});
Chat.set('toJSON', {
    virtuals: true,
    getters: true,
    transform: function(doc, ret, options) {
        delete ret._id;
        delete ret[Chat.options.versionKey];
        delete ret[Chat.options.discriminatorKey];
        return ret;
    }
});
module.exports = mongoose.model('Chat', Chat);