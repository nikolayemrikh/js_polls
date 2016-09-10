var express = require('express');
var router = express.Router();

var user = require('./user');
var room = require('./room');
var schedule = require('./schedule');
var blank = require('./blank');
var timetable = require('./timetable');
var chat = require('./chat');
var suggest = require('./suggest');
var action = require('./action');
var jobs = require('./jobs');
var poll = require('./poll');
router.use('/user', user);
router.use('/room', room);
router.use('/schedule', schedule);
router.use('/blank', blank);
router.use('/chat', chat);
router.use('/timetable', timetable);
router.use('/suggest', suggest);
router.use('/action', action);
router.use('/jobs', jobs);
router.use('/poll', poll);

module.exports = router;