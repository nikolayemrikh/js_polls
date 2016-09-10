var express = require('express');
var router = express.Router();

var rest = require('../../db').dao('rest');

router.get('/', function(req, res, next) {
    var args = {
        model: 'room',
        filter: req.query.filter || {},
        skip: req.query.skip,
        limit: req.query.limit,
        sort: req.query.sort,
        select: req.query.select,
        populate: req.query.populate
    };
    switch (req.user.role) {
        case 1:
            args.filter.student = req.user.id;
            args.populate = false;
            break;
        case 2:
            args.filter.proctor = req.user.id;
            args.populate = [{
                path: 'student',
                select: 'username lastname firstname middlename fullname'
            }];
            break;
        case 3:
            break;
        default:
            return res.status(401).end();
    }
    rest.read(args, function(err, data) {
        if (err) return next(err);
        res.json(data);
    });
});

router.get('/:roomId', function(req, res, next) {
    var args = {
        model: 'room',
        documentId: req.params.roomId,
        select: req.query.select,
        populate: req.query.populate
    };
    switch (req.user.role) {
        case 1:
            args.filter = {
                student: req.user.id
            };
            args.populate = [{
                path: 'student',
                select: 'username provider firstname lastname middlename fullname'
            }, {
                path: 'proctor',
                select: 'firstname lastname middlename fullname'
            }];
            break;
        case 2:
            args.filter = {
                proctor: req.user.id
            };
            args.populate = [{
                path: 'student',
                select: 'username provider firstname lastname middlename fullname'
            }, {
                path: 'proctor',
                select: 'username provider firstname lastname middlename fullname'
            }];
            break;
        case 3:
            break;
        default:
            return res.status(401).end();
    }
    rest.read(args, function(err, data) {
        if (err) return next(err);
        res.json(data);
    });
});

router.post('/', function(req, res, next) {
    var args = {
        model: 'room',
        data: req.body
    };
    switch (req.user.role) {
        case 3:
            break;
        default:
            return res.status(401).end();
    }
    rest.create(args, function(err, data) {
        if (err) return next(err);
        res.json(data);
    });
});

router.put('/:roomId', function(req, res, next) {
    var args = {
        model: 'room',
        documentId: req.params.roomId,
        data: req.body
    };
    switch (req.user.role) {
        case 3:
            break;
        default:
            return res.status(401).end();
    }
    rest.update(args, function(err, data) {
        if (err) return next(err);
        res.json(data);
    });
});

router.delete('/:roomId', function(req, res, next) {
    var args = {
        model: 'room',
        documentId: req.params.roomId
    };
    switch (req.user.role) {
        case 3:
            break;
        default:
            return res.status(401).end();
    }
    rest.delete(args, function(err, data) {
        if (err) return next(err);
        res.json(data);
    });
});

module.exports = router;