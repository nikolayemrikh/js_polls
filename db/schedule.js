var config = require('nconf');
var moment = require('moment');
var logger = require('../common/logger');

var Room = require('./models/room');
var Schedule = require('./models/schedule');

var dao = {
    /**
     * Получить список доступных часов для записи и список прокторов,
     * которые свободны в это время.
     * 
     * TODO: расписание для сеансов меньше и больше 1 часа
     * 
     * @param {Date} args.leftDate - Дата начала поиска свободных часов.
     * @param {Date} args.rightDate - Дата окончания поиска свободных часов.
     * @param {Number} args.duration - Продолжительность сеанса в минутах.
     * @returns {function} callback(err, {dates[], proctors[]})
     */
    vacant: function(args, callback) {
        var concurrent = Number(config.get('schedule:concurrent'));
        var interval = Number(config.get('schedule:interval'));
        var duration = Math.ceil((Number(args.duration) + interval) / 60);
        var offset = Number(config.get('schedule:offset'));
        var now = moment().add(offset, 'hours');
        var leftDate = moment.max(now, moment(args.leftDate)).startOf('hour');
        var rightDate = moment(args.rightDate).add(1, 'hours').startOf('hour');
        var timetable = {};
        Schedule.find({
            beginDate: {
                '$lt': rightDate
            },
            endDate: {
                '$gt': leftDate
            }
        }).exec(function(err, schedules) {
            if (err) return callback(err);
            // формируем таблицу доступных рабочих часов каждого проктора
            for (var i = 0, li = schedules.length; i < li; i++) {
                var proctor = schedules[i].proctor;
                var beginDate = moment(schedules[i].beginDate);
                var endDate = moment(schedules[i].endDate);
                if (!timetable[proctor]) timetable[proctor] = [];
                var start = beginDate.diff(leftDate, 'hours');
                var times = moment.min(rightDate, endDate).diff(beginDate, 'hours', true);
                for (var j = start < 0 ? 0 : start, lj = start + times; j < lj; j++) {
                    if (timetable[proctor][j]) timetable[proctor][j] += concurrent;
                    else timetable[proctor][j] = concurrent;
                }
            }
            //console.log(timetable);
            Room.find({
                beginDate: {
                    '$lt': rightDate
                },
                endDate: {
                    '$gt': leftDate
                }
            }).exec(function(err, rooms) {
                if (err) return callback(err);
                // исключаем из таблицы уже запланированные сеансы
                for (var i = 0, li = rooms.length; i < li; i++) {
                    var proctor = rooms[i].proctor;
                    var beginDate = moment(rooms[i].beginDate);
                    var endDate = moment(rooms[i].endDate);
                    var start = beginDate.diff(leftDate, 'hours');
                    var times = moment.min(rightDate, endDate).diff(beginDate, 'hours', true);
                    for (var j = start < 0 ? 0 : start, lj = start + times; j < lj; j++) {
                        if (timetable[proctor] && timetable[proctor][j] > 0) timetable[proctor][j]--;
                    }
                }
                //console.log(timetable);
                // определяем доступные для записи часы с учетом duration
                var hours = [];
                var proctors = [];
                for (var proctor in timetable) {
                    var arr = timetable[proctor];
                    var seq = 0;
                    var available = false;
                    for (var m = 0, lm = arr.length; m < lm; m++) {
                        if (!arr[m] > 0) seq = 0;
                        else if (++seq >= duration) {
                            var n = m + 1 - duration;
                            hours.push(n);
                            available = true;
                        }
                    }
                    if (available) proctors.push(proctor);
                }
                //console.log(hours);
                // сортируем, исключаем повторы и преобразуем в даты
                var dates = hours.sort(function(a, b) {
                    return a - b;
                }).filter(function(item, pos, arr) {
                    return !pos || item != arr[pos - 1];
                }).map(function(v) {
                    return moment(leftDate).add(v, 'hours');
                });
                //callback(null, dates);
                callback(null, {
                    dates: dates,
                    proctors: proctors
                });
            });
        });
    },
    /**
     * Обновить расписание на неделю.
     * Сначала полностью удаляется старое расписание, а затем добавляется новое.
     * 
     * @param {ObjectId} args.userId - Идентификатор проктора.
     * @param {Date} args.beginDate - Дата начала недели.
     * @param {Date} args.endDate - Дата окончания недели.
     * @param {String[]} args.filledDates - Новые даты.
     * @param {Date} args.dates[].beginDate - Дата начала работы проктора.
     * @param {Date} args.dates[].endDate - Дата окончания работы проктора.
     * @returns {function} callback(err)
     */
    update: function(args, callback) {
        var query = {
            proctor: args.userId,
            beginDate: {
                '$gte': args.beginDate
            },
            endDate: {
                '$lt': args.endDate
            }
        };
        Schedule.remove(query, function(err) {
            if (err) return callback(err);
            var size = args.filledDates.length;
            if (!size) return callback(null, {});
            var onSave = function(err, data) {
                if (err) logger.warn(err);
                if (--size < 1) callback(null, {});
            };
            for (var i = 0, l = args.filledDates.length; i < l; i++) {
                var item = args.filledDates[i];
                var schedule = new Schedule({
                    proctor: args.userId,
                    beginDate: item.beginDate,
                    endDate: item.endDate
                });
                schedule.save(onSave);
            }
        });
    }
};

module.exports = dao;