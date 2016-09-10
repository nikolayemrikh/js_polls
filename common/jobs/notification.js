var config = require('nconf');
var moment = require('moment');
var Room = require('../../db').model('room');

// Уведомить студента за N минут до начала сеанса
var notification = config.get('schedule:notification');

module.exports = function(agenda) {
    agenda.define('upcomingNotification', function(job, done) {
        Room.find({
            '$and': [{
                beginDate: {
                    '$gte':  moment().add(notification, 'minutes')
                }
            }, {
                beginDate: {
                    '$lte': moment().add(notification * 2, 'minutes')
                }
            }]
        }).populate('student').exec(function(err, data) {
            if (err || !data) return done(err);
            data.forEach(function(item) {
                if (!item.student.email) return;
                agenda.now('sendEmail', {
                    // поле output отображается в таблице администратора
                    output: item.student.email,
                    recipients: {
                        name: item.student.fullname,
                        address: item.student.email
                    },
                    message: {
                        student: {
                            firstname: item.student.firstname,
                            lastname: item.student.lastname,
                            middlename: item.student.middlename,
                            fullname: item.student.fullname,
                            gender: item.student.gender
                        },
                        subject: item.subject,
                        beginDate: item.beginDate,
                        duration: item.duration
                    },
                    template: 'upcoming-notification'
                });
            });
            done();
        });
    });

    if (notification) {
        agenda.on('ready', function() {
            agenda.every(notification + ' minutes', 'upcomingNotification');
        });
    }
};