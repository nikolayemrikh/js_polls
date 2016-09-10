/**
 * Модель комнаты (сеанса)
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var User = require('./user').schema;
var Room = new Schema({
    // Идентификатор экзамена в LMS
    examId: {
        type: String
    },
    // Название
    subject: {
        type: String,
        required: true
    },
    // Плановая продолжительность в минутах
    duration: {
        type: Number,
        required: true,
        min: 1
    },
    // Дата начала интервала планирования
    leftDate: {
        type: Date,
        required: true
    },
    // Дата окончания интервала планирования
    rightDate: {
        type: Date,
        required: true,
        validate: {
          validator: function(value) {
            return this.leftDate <= value;
          },
          message: 'rightDate cannot be less of leftDate'
        }
    },
    // Студент
    student: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Проктор
    proctor: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    // Плановое время начала
    beginDate: {
        type: Date
    },
    // Плановое время окончания
    endDate: {
        type: Date,
        validate: {
          validator: function(value) {
            return this.beginDate <= value;
          },
          message: 'endDate cannot be less of beginDate'
        }
    },
    // Фактическое время начала
    startDate: {
        type: Date
    },
    // Фактическое время окончания
    stopDate: {
        type: Date
    },
    // Заключение: accepted - положительное, rejected - отрицательное
    resolution: {
        type: String,
        enum: [null, 'accepted', 'rejected']
    },
    // Комментарий
    comment: {
        type: String
    },
    // Видеозапись
    record: {
        type: Boolean,
        default: true
    },
    // Видеозапись сохранена и перекодирована
    archived: {
        type: Boolean
    },
    // Произвольные метаданные
    metadata: {}
}, {
    timestamps: true
});
Room.set('toJSON', {
    virtuals: true,
    getters: true,
    transform: function(doc, ret, options) {
        delete ret._id;
        delete ret[Room.options.versionKey];
        delete ret[Room.options.discriminatorKey];
        return ret;
    }
});
Room.index({
    student: 1,
    examId: 1
}, {
    unique: true
});
module.exports = mongoose.model('Room', Room);