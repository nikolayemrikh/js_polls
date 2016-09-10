var express = require('express');
var router = express.Router();
var config = require('nconf');

var logger = require('../../common/logger');
var room = require('../../db/room');

function getIntegrator(lms) {
    if (!lms) return;
    try {
        return require('./' + lms);
    }
    catch (e) {
        return;
    }
}

function onError(err, next) {
    logger.error(err);
    next();
}

router.api = {
    /**
     * Получить список экзаменов из LMS.
     * 
     * @param {Object} req.user - Данные пользовательской сессии.
     */
    fetch: function(req, res, next) {
        var user = req.user || {};
        var lms = config.get('auth:' + user.provider + ':lms');
        var integrator = getIntegrator(lms);
        if (!integrator || !integrator.fetch) return next();
        var conf = config.get('lms:' + lms) || {};
        integrator.fetch(conf, {
            user: user
        }, function(err, exams) {
            if (err) return onError(err, next);
            if (exams && exams.length) {
                room.append({
                    userId: user.id,
                    exams: exams
                }, function(err, data) {
                    if (err) return onError(err, next);
                    next();
                });
            }
            else next();
        });
    },
    /**
     * Запустить экзамен в LMS.
     * 
     * @param {Object} req.user - Данные пользовательской сессии.
     * @param {String} res.locals.data - Данные текущей комнаты.
     */
    start: function(req, res, next) {
        var user = req.user || {};
        var room = res.locals.data;
        var lms = config.get('auth:' + user.provider + ':lms');
        var integrator = getIntegrator(lms);
        if (!integrator || !integrator.start) return next();
        var conf = config.get('lms:' + lms) || {};
        integrator.start(conf, {
            user: user,
            room: room
        }, function(err, data) {
            if (err) return onError(err, next);
            res.locals.data = data;
            next();
        });
    },
    /**
     * Завершить экзамен в LMS.
     * 
     * @param {Object} req.user - Данные пользовательской сессии.
     * @param {String} res.locals.data - Данные текущей комнаты.
     */
    finish: function(req, res, next) {
        var user = req.user || {};
        var room = res.locals.data;
        var lms = config.get('auth:' + user.provider + ':lms');
        var integrator = getIntegrator(lms);
        if (!integrator || !integrator.finish) return next();
        var conf = config.get('lms:' + lms) || {};        
        integrator.finish(conf, {
            user: user,
            room: room
        }, function(err, data) {
            if (err) return onError(err, next);
            res.locals.data = data;
            next();
        });
    },
    /**
     * Получить состояние экзамена в LMS.
     * 
     * @param {Object} req.user - Данные пользовательской сессии.
     * @param {String} res.locals.data - Данные текущей комнаты.
     * @returns {Object} res.locals.data - Возвращаемые данные (задаются в конфиге).
     */
    state: function(req, res, next) {
        var user = req.user || {};
        var room = res.locals.data;
        res.locals.data = null;
        var lms = config.get('auth:' + user.provider + ':lms');
        var integrator = getIntegrator(lms);
        if (!integrator || !integrator.state) return next();
        var conf = config.get('lms:' + lms) || {};
        integrator.state(conf, {
            user: user,
            room: room
        }, function(err, data) {
            if (err) return onError(err, next);
            res.locals.data = data;
            next();
        });
    },
    /**
     * Передать заключение проктора в LMS.
     * 
     * @param {Object} req.user - Данные пользовательской сессии.
     * @param {String} res.locals.data - Данные текущей комнаты.
     */
    submit: function(req, res, next) {
        var user = req.user || {};
        var room = res.locals.data;
        var lms = config.get('auth:' + user.provider + ':lms');
        var integrator = getIntegrator(lms);
        if (!integrator || !integrator.submit) return next();
        var conf = config.get('lms:' + lms) || {};
        integrator.submit(conf, {
            user: user,
            room: room
        }, function(err, data) {
            if (err) return onError(err, next);
            res.locals.data = data;
            next();
        });
    }
};

/**
 * Обновление метаданных комнаты.
 */
router.post('/:lms/metadata', function(req, res, next) {
    var lms = req.params.lms;
    var integrator = getIntegrator(lms);
    if (!integrator || !integrator.metadata) return res.status(400).end();
    var conf = config.get('lms:' + lms) || {};
    integrator.metadata(conf, {
        headers: req.headers,
        body: req.body,
        update: room.updateMetadata
    }, function(statusCode, data) {
        if (data) res.json(data);
        else res.status(statusCode).end();
    });
});

/**
 * Получить публичные настройки LMS, с которой ассоциирован пользователь.
 */
router.get('/options', function(req, res, next) {
    var user = req.user || {};
    var lms = config.get('auth:' + user.provider + ':lms');
    var conf = config.get('lms:' + lms + ":options") || {};
    res.json(conf);
});

// for debug
// router.all('/echo', function(req, res) {
//     console.log(req.headers);
//     console.log(req.body);
//     res.json(req.body);
// });

module.exports = router;