/**
 * Модель рабочего расписания инспекторов
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var User = require('./user').schema;
var Schedule = new Schema({
    // Проктор
    proctor: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Время начала работы
    beginDate: {
        type: Date,
        required: true
    },
    // Время окончания работы
    endDate: {
        type: Date,
        required: true,
        validate: {
          validator: function(value) {
            return this.beginDate < value;
          },
          message: 'endDate cannot be less or equals beginDate'
        }
    }
}, {
    timestamps: true
});
Schedule.set('toJSON', {
    virtuals: true,
    getters: true,
    transform: function(doc, ret, options) {
        delete ret._id;
        delete ret[Schedule.options.versionKey];
        delete ret[Schedule.options.discriminatorKey];
        return ret;
    }
});
module.exports = mongoose.model('Schedule', Schedule);