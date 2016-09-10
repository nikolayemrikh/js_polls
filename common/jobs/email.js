var config = require('nconf');
var moment = require('moment');
var path = require('path');
var transporter = require('../mailer');
var EmailTemplate = require('email-templates').EmailTemplate;

module.exports = function(agenda) {
    agenda.define('sendEmail', function(job, done) {
        if (job.attrs.data.template) {
            var tpldir = path.join(config.get('email:tpldir'), job.attrs.data.template);
            var sendEmail = transporter.templateSender(new EmailTemplate(tpldir), {
                    from: config.get('email:from')
                });
            sendEmail({
                to: job.attrs.data.recipients
            }, {
                moment: moment,
                message: job.attrs.data.message
            }, function(err, info) {
                if (err) return done(err);
                done();
            });
        }
        else {
            transporter.sendMail({
                from: config.get('email:from'),
                to: job.attrs.data.recipients,
                subject: job.attrs.data.subject,
                text: job.attrs.data.text
            }, function(err, data) {
                if (err) return done(err);
                done();
            });
        }
    });
};