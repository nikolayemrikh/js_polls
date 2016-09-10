var express = require('express');
var router = express.Router();

var auth = require('../auth');
var schedule = require('../../db').dao('schedule');

/**
 * Получить список доступных часов для записи на сеанс.
 */
router.get('/', auth.isStudent, function(req, res, next) {
    var args = {
        leftDate: req.query.leftDate,
        rightDate: req.query.rightDate,
        duration: req.query.duration
    };
    if (!args.leftDate || !args.rightDate || !args.duration) {
        res.status(400);
        return next(new Error('Required parameters are not specified'));
    }
    schedule.vacant(args, function(err, data) {
        if (err) return next(err);
        res.json(data.dates);
    });
});

/**
 * Обновить расписание на указанную неделю.
 * 
 * @param {Date} req.body.beginDate
 * @param {Date} req.body.endDate
 * @param {Object[]} req.body.filledDates
 */
router.post('/', auth.isProctor, function(req, res, next) {
    var args = {
        userId: req.user.id,
        beginDate: req.body.beginDate,
        endDate: req.body.endDate,
        filledDates: req.body.filledDates || []
    };
    schedule.update(args, function(err, data) {
        if (err) return next(err);
        res.json(data);
    });
});

module.exports = router;