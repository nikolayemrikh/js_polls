var config = require('nconf');
var moment = require('moment');
var logger = require('../common/logger');
var schedule = require('./schedule');

var Room = require('./models/room');
var User = require('./models/user');
var Blank = require('./models/blank');

var dao = {
    /**
     * Запланировать время сеанса.
     * Проверяется есть ли для указанной комнаты и даты свободные прокторы.
     * Если прокторы есть, то устанавливается дата начала и окончания сеанса.
     * 
     * @param {ObjectId} args.roomId - Идентификатор комнаты.
     * @param {ObjectId} [args.userId] - Идентификатор студента.
     * @param {Date} args.beginDate - Желаемая дата начала сеанса.
     * @returns {function} callback(err, data)
     */
    plan: function(args, callback) {
        var filter = {
            _id: args.roomId
        };
        if (args.userId) filter.student = args.userId;
        Room.findOne(filter).exec(function(err, room) {
            if (err || !room) return callback(err);
            var interval = Number(config.get('schedule:interval'));
            var duration = Number(room.duration);
            var beginDate = moment(args.beginDate);
            var endDate = moment(beginDate).add(duration + interval, 'minutes');
            schedule.vacant({
                leftDate: beginDate,
                rightDate: endDate,
                duration: duration
            }, function(err, data) {
                if (err) return callback(err);
                console.log(data);
                var amount = data.proctors.length;
                if (!amount) return callback();
                Room.update({
                    _id: args.roomId
                }, {
                    '$set': {
                        // выбор случайного проктора
                        proctor: data.proctors[Math.floor(Math.random() * amount)],
                        beginDate: beginDate,
                        endDate: endDate
                    }
                }, callback);
            });
        });
    },
    /**
     * Отменить запланированный сеанс.
     * Можно отменить только еще не начавшийся по времени сеанс.
     * 
     * @param {ObjectId} args.roomId - Идентификатор комнаты.
     * @param {ObjectId} args.userId - Идентификатор студента.
     * @returns {function} callback(err, data)
     */
    revoke: function(args, callback) {
        var now = moment().add(1, 'hours').startOf('hour');
        var filter = {
            _id: args.roomId,
            beginDate: {
                '$gte': now
            }
        };
        if (args.userId) filter.student = args.userId;
        Room.findOneAndUpdate(filter, {
            '$set': {
                beginDate: null,
                endDate: null,
                proctor: null
            }
        }, {
            'new': true
        }).exec(callback);
    },
    /**
     * Добавить комнату, только если с указанным examId еще не существуют.
     * Используется для добавления комнат через API для LMS.
     * 
     * @param {ObjectId} args.userId - Идентификатор студента.
     * @param {Object[]} args.exams - Список экзаменов из LMS.
     * @param {String} args.exams[].examId - Идентификатор экзамена в LMS.
     * @param {String} args.exams[].subject - Название экзамена.
     * @param {Number} args.exams[].duration - Длительность экзамена в минутах.
     * @param {Date} args.exams[].leftDate - Начальная дата сдачи экзамена.
     * @param {Date} args.exams[].rightDate - Конечная дата сдачи экзамена.
     * @returns {function} callback(err)
     */
    append: function(args, callback) {
        Room.find({
            student: args.userId
        }).exec(function(err, rooms) {
            if (err || !rooms) return callback(err);
            var appends = args.exams || [];
            if (!appends.length) return callback(null, rooms);
            var saved = 0;
            for (var i = 0, l = appends.length; i < l; i++) {
                appends[i].student = args.userId;
                var room = new Room(appends[i]);
                room.save(function(err, data) {
                    if (data) rooms.push(data);
                    if (++saved === l) return callback(null, rooms);
                    if (err) return logger.warn(err);
                });
            }
        });
    },
    /**
     * Обновить метаданные комнаты.
     * 
     * @param {String} args.examId - Идентификатор экзамена в LMS.
     * @param {String} args.metadata - Метаданные.
     * @param {String} args.username - Имя пользовталея.
     * @param {String} args.provider - Провайдер авторизации.
     */
    updateMetadata: function(args, callback) {
        User.findOne({
            username: args.username,
            provider: args.provider
        }).exec(function(err, user) {
            if (err || !user) return callback(err);
            Room.findOneAndUpdate({
                examId: args.examId,
                student: user._id
            }, {
                '$set': {
                    metadata: args.metadata
                }
            }, {
                'new': true
            }).exec(callback);
        });
    },
    /**
     * Начать сеанс (выполняется студентом).
     * 
     * @param {ObjectId} args.userId - Идентификатор студента.
     * @param {ObjectId} args.roomId - Идентификатор комнаты.
     */
    start: function(args, callback) {
        Room.findOneAndUpdate({
            _id: args.roomId,
            student: args.userId,
            startDate: null
        }, {
            '$set': {
                startDate: moment()
            }
        }, {
            'new': true
        }).exec(callback);
    },
    /**
     * Закончить сеанс (выполняется студентом).
     * 
     * @param {ObjectId} args.userId - Идентификатор студента.
     * @param {ObjectId} args.roomId - Идентификатор комнаты.
     */
    finish: function(args, callback) {
        Room.findOneAndUpdate({
            _id: args.roomId,
            student: args.userId,
            stopDate: null
        }, {
            '$set': {
                stopDate: moment()
            }
        }, {
            'new': true
        }).exec(callback);
    },
    /**
     * Сохранить заключение проктора и комментарий.
     * 
     * @param {ObjectId} args.userId - Идентификатор проктора.
     * @param {ObjectId} args.roomId - Идентификатор сеанса.
     * @param {String} args.resolution - Заключение проктора.
     * @param {String} args.comment - Комментарий проктора.
     */
    submit: function(args, callback) {
        Room.findOne({
            _id: args.roomId,
            proctor: args.userId
        }, function(err, room) {
            if (err || !room) return callback(err);
            if (!room.stopDate) room.stopDate = moment();
            room.resolution = args.resolution;
            room.comment = args.comment;
            room.save(callback);
        });
    },
    /**
     * Импортировать сеансы из бланков.
     * 
     * @param {String} args.username - Логин пользователя.
     * @param {String} args.provider - Провайдер аврторизации
     * @param {String} args.userId - Идентификатор пользователя.
     */
    importFromBlanks: function(args, callback) {
        Blank.find({
            username: args.username,
            provider: args.provider
        }, function(err, blanks) {
            if (err || !blanks) return callback(err);
            dao.append({
                userId: args.userId,
                exams: blanks
            }, callback);
        });
    }
};

module.exports = dao;