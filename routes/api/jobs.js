var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var moment = require('moment');

var auth = require('../auth');
var agenda = require('../../common/agenda');

router.get('/', auth.isAdministrator, function(req, res, next) {
    agenda.jobs({}, function(err, jobs) {
        if (err) return next(err);
        res.json(jobs.map(function(item) {
            var data = item.attrs;
            data.id = data._id;
            delete data._id;
            return data;
        }));
    });
});

router.put('/:jobId', function(req, res, next) {
    var id = mongoose.Types.ObjectId(req.params.jobId);
    agenda.jobs(id, function(err, jobs) {
        if (err || !jobs.length) return next(err);
        jobs[0].attrs.nextRunAt = moment().add(10, 'seconds').toDate();
        jobs[0].attrs.lastFinishedAt = null;
        jobs[0].attrs.lastRunAt = null;
        jobs[0].save();
        res.json(jobs[0].attrs);
    });
});

router.delete('/:jobId', function(req, res, next) {
    var id = mongoose.Types.ObjectId(req.params.jobId);
    agenda.jobs(id, function(err, jobs) {
        if (err || !jobs.length) return next(err);
        jobs[0].remove();
        res.json(jobs[0].attrs);
    });
});

module.exports = router;