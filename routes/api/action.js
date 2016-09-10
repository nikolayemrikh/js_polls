var express = require('express');
var router = express.Router();

var lms = require('../lms');
var room = require('../../db').dao('room');
var rest = require('../../db').dao('rest');

function requestError(res, next) {
    res.status(400);
    return next(new Error('Required parameters are not specified'));
}

/**
 * Получить список комнат (сеансов).
 * 
 * 1. Импортировать из LMS.
 * 2. Импортировать из бланков и получить список всех сеансов.
 * 
 */
router.get('/fetch', lms.api.fetch, function(req, res, next) {
    var args = {
        userId: req.user.id,
        username: req.user.username,
        provider: req.user.provider
    };
    room.importFromBlanks(args, function(err, data) {
        if (err) return next(err);
        res.json(data);
    });
});

/**
 * Студент начинает сеанс.
 */
router.post('/start', function(req, res, next) {
    var args = {
        userId: req.user.id,
        roomId: req.body.roomId
    };
    if (!args.roomId) return requestError(res, next);
    room.start(args, function(err, data) {
        if (err) return next(err);
        res.locals.data = data;
        res.json(data);
    });
}, lms.api.start, function(req, res) {
    // end
});

/**
 * Студент завершает сеанс.
 */
router.post('/finish', function(req, res, next) {
    var args = {
        userId: req.user.id,
        roomId: req.body.roomId
    };
    if (!args.roomId) return requestError(res, next);
    room.finish(args, function(err, data) {
        if (err) return next(err);
        res.locals.data = data;
        res.json(data);
    });
}, lms.api.finish, function(req, res) {
    // end
});

/**
 * Проктор дает заключение.
 * 
 * Остановка осуществляется в два этапа:
 * 1. Сохранение заключения проктора.
 * 2. Передача заключения проктора в LMS по API.
 */
router.post('/submit', function(req, res, next) {
    var args = {
        userId: req.user.id,
        roomId: req.body.roomId,
        resolution: req.body.resolution,
        comment: req.body.comment
    };
    if (!args.roomId || !args.resolution) return requestError(res, next);
    room.submit(args, function(err, data) {
        if (err) return next(err);
        res.locals.data = data;
        res.json(data);
    });
}, lms.api.submit, function(req, res) {
    // end
});

/**
 * Состояние экзамена в LMS.
 */
router.post('/state', function(req, res, next) {
    var args = {
        model: 'room',
        documentId: req.body.roomId
    };
    if (!args.documentId) return requestError(res, next);
    rest.read(args, function(err, data) {
        if (err) return next(err);
        res.locals.data = data;
        next();
    });
}, lms.api.state, function(req, res, next) {
    res.json(res.locals.data || {});
});

/**
 * Запланировать сеанс на указанную дату.
 */
router.post('/plan', function(req, res, next) {
    var args = {
        roomId: req.body.roomId,
        beginDate: req.body.beginDate
    };
    if (!args.roomId || !args.beginDate) return requestError(res, next);
    if (req.user.role < 3) args.userId = req.user.id;
    room.plan(args, function(err, data) {
        if (err) return next(err);
        res.json(data);
    });
});

/**
 * Отменить сеанс.
 */
router.post('/revoke', function(req, res, next) {
    var args = {
        roomId: req.body.roomId
    };
    if (!args.roomId) return requestError(res, next);
    if (req.user.role < 3) args.userId = req.user.id;
    room.revoke(args, function(err, data) {
        if (err) return next(err);
        res.json(data);
    });
});

module.exports = router;