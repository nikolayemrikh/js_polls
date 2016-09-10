var auth = require('./auth');
var rest = require('./rest');
var lms = require('./lms');
var api = require('./api');
var tools = require('./tools');
var storage = require('./storage');
var stream = require('./stream');
var mail = require('./mail');
module.exports = function(app) {
    app.use('/auth', auth);
    app.use('/rest', rest);
    app.use('/lms', lms);
    app.use('/api', auth.isAuth, api);
    app.use('/tools', auth.isAuth, tools);
    app.use('/storage', auth.isAuth, storage);
    app.use('/stream', auth.isProctor, stream);
    app.use('/mail', auth.isAdministrator, mail);
};