/**
 * Модель пользователя
 */
var mongoose = require('mongoose');
var crypto = require('crypto');
var Schema = mongoose.Schema;
var storage = require('../storage');
var User = new Schema({
    // Логин
    username: {
        type: String,
        required: true,
        default: mongoose.Types.ObjectId
    },
    // Провайдер авторизации
    provider: {
        type: String,
        required: true,
        default: 'plain'
    },
    // Хэш пароля
    hashedPassword: {
        type: String,
        select: false,
        required: true
    },
    // Соль для пароля
    salt: {
        type: String,
        select: false,
        required: true
    },
    // Электронная почта
    email: {
        type: String,
        required: true
    },
    // Роль пользователя: 1 = Студент, 2 = Проктор, 3 = Администратор
    role: {
        type: Number,
        default: 1,
        min: 1,
        max: 3
    },
    // Разрешен вход или нет
    active: {
        type: Boolean,
        default: true
    },
    // Дата последнего входа
    lastLogon: {
        type: Date
    },
    // Полное имя (заполняется автоматически)
    fullname: {
        type: String
    },
    // Имя
    firstname: {
        type: String
    },
    // Фамилия
    lastname: {
        type: String
    },
    // Отчество
    middlename: {
        type: String
    },
    // Пол
    gender: {
        type: String,
        enum: [null, 'm', 'f']
    },
    // День рождения
    birthday: {
        type: String
    },
    // Гражданство
    citizenship: {
        type: String
    },
    // Тип документа: паспорт, иностранный документ и т.п.
    documentType: {
        type: String
    },
    // Серия и номер документа
    documentNumber: {
        type: String
    },
    // Дата выдачи документа
    documentIssueDate: {
        type: String
    },
    // Почтовый адрес
    address: {
        type: String
    },
    // Дополнительная информация
    other: {
        type: String
    },
    // Связанные с пользователем файлы (фотография пользователя)
    attach: []
}, {
    timestamps: true
});
User.methods.encryptPassword = function(password) {
    return crypto.createHmac('sha1', this.salt).update(password).digest('hex');
    //more secure - return crypto.pbkdf2Sync(password, this.salt, 10000, 512);
};
User.methods.validPassword = function(password) {
    return this.encryptPassword(password) === this.hashedPassword;
};
User.methods.isActive = function() {
    return this.active === true;
};
User.virtual('password').set(function(password) {
    if (!password) password = crypto.randomBytes(8).toString('base64');
    this._plainPassword = password;
    this.salt = crypto.randomBytes(32).toString('base64');
    //more secure - this.salt = crypto.randomBytes(128).toString('base64');
    this.hashedPassword = this.encryptPassword(password);
}).get(function() {
    return this._plainPassword;
});
User.set('toJSON', {
    virtuals: true,
    getters: true,
    transform: function(doc, ret, options) {
        delete ret._id;
        delete ret[User.options.versionKey];
        delete ret[User.options.discriminatorKey];
        delete ret.hashedPassword;
        delete ret.salt;
        delete ret.password;
        return ret;
    }
});
User.pre('save', function(next) {
    this.fullname = [this.lastname, this.firstname, this.middlename].join(' ').trim();
    var self = this;
    storage.upload(this.attach, function(attach){
        // console.log(attach);
        self.attach = attach;
        next();
    });
});
// User.post('save', function(doc) {
//   console.log('%s has been saved', doc.attach);
// });
// User.post('remove', function(doc) {
//   console.log('%s has been removed', doc.attach);
// });
User.index({
    username: 1,
    provider: 1
}, {
    unique: true
});
User.index({
    email: 1
}, {
    unique: true
});
module.exports = mongoose.model('User', User);