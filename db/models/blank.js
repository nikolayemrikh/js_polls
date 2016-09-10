/**
 * Модель бланка экзамена
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Blank = new Schema({
    // Электронный адрес пользователя
    email: {
        type: String,
        required: true
    },
    // Идентификатор экзамена в LMS
    examId: {
        type: String,
        required: true
    },
    // Название экзамена
    subject: {
        type: String,
        required: true
    },
    // Плановая продолжительность экзамена в минутах
    duration: {
        type: Number,
        required: true,
        min: 1
    },
    // Верхняя граница сдачи экзамена
    leftDate: {
        type: Date,
        required: true
    },
    // Нижняя граница сдачи экзамена
    rightDate: {
        type: Date,
        required: true,
        validate: {
          validator: function(value) {
            return this.leftDate <= value;
          },
          message: 'rightDate cannot be less of leftDate'
        }
    }
}, {
    timestamps: true
});
Blank.set('toJSON', {
    virtuals: true,
    getters: true,
    transform: function(doc, ret, options) {
        delete ret._id;
        delete ret[Blank.options.versionKey];
        delete ret[Blank.options.discriminatorKey];
        return ret;
    }
});
Blank.index({
    email: 1,
    examId: 1
}, {
    unique: true
});
module.exports = mongoose.model('Blank', Blank);