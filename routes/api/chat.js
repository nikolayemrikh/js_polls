var express = require('express');
var router = express.Router();

var rest = require('../../db').dao('rest');

/**
 * Получить список сообщений в чате.
 * 
 * @param {String} req.params.roomId - Идентификатор комнаты.
 */
router.get('/:roomId', function(req, res, next) {
    var args = {
        model: 'chat',
        filter: {
            room: req.params.roomId
        },
        sort: 'createdAt',
        populate: [{
            path: 'user',
            select: 'lastname firstname middlename fullname'
        }]
    };
    rest.read(args, function(err, data) {
        if (err) return next(err);
        res.json(data);
    });
});

/**
 * Создать новое сообщение.
 * 
 * @param {String} req.params.roomId - Идентификатор комнаты.
 */
router.post('/:roomId', function(req, res, next) {
    var args = {
        model: 'chat',
        data: req.body,
        populate: [{
            path: 'user',
            select: 'lastname firstname middlename fullname'
        }]
    };
    args.data.room = req.params.roomId;
    args.data.user = req.user.id;
    rest.create(args, function(err, data) {
        if (err) return next(err);
        res.json(data);
    });
});

module.exports = router;