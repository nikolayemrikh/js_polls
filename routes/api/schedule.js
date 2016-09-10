var express = require('express');
var router = express.Router();

var rest = require('../../db').dao('rest');

router.get('/', function(req, res, next) {
    var args = {
        model: 'schedule',
        filter: req.query.filter || {},
        skip: req.query.skip,
        limit: req.query.limit,
        sort: req.query.sort,
        select: req.query.select,
        populate: req.query.populate
    };
    switch (req.user.role) {
        case 2:
            args.filter.proctor = req.user.id;
            args.limit = 84; // Максимальное число записей за неделю: 12 x 7 = 84
            args.select = 'proctor beginDate endDate';
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

router.get('/:scheduleId', function(req, res, next) {
    var args = {
        model: 'schedule',
        documentId: req.params.scheduleId,
        select: req.query.select,
        populate: req.query.populate
    };
    switch (req.user.role) {
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
        model: 'schedule',
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

router.put('/:scheduleId', function(req, res, next) {
    var args = {
        model: 'schedule',
        documentId: req.params.scheduleId,
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

router.delete('/:scheduleId', function(req, res, next) {
    var args = {
        model: 'schedule',
        documentId: req.params.scheduleId
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