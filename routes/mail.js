var express = require('express');
var router = express.Router();
var agenda = require('../common/agenda');

/**
 * Отправить сообщение по электронной почте.
 */
router.post('/send', function(req, res, next) {
    agenda.now('sendEmail', {
        recipients: req.body.recipients,
        subject: req.body.subject,
        text: req.body.text
    });
    res.end();
});

module.exports = router;