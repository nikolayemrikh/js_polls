var User = require('./models/user');

var dao = {
    /**
     * Авторизация по логину и паролю.
     * 
     * @param {String} username - Электронный адрес или логин пользователя.
     * @param {String} password - Пароль пользователя.
     * @param {function} done(err, user, message)
     */
    local: function(username, password, done) {
        User.findOne({
            '$or': [{
                email: username
            }, {
                username: username,
                provider: 'plain'
            }]
        }).select("+hashedPassword +salt").exec(function(err, user) {
            if (err) return done(err);
            if (!user) {
                return done(null, false, {
                    message: 'Incorrect username'
                });
            }
            if (!user.isActive()) {
                return done(null, false, {
                    message: 'User is inactive'
                });
            }
            if (!user.validPassword(password)) {
                return done(null, false, {
                    message: 'Incorrect password'
                });
            }
            user.lastLogon = new Date();
            user.save();
            return done(null, user);
        });
    },
    /**
     * Авторизация через внешний сервис.
     * 
     * @param {String} provider - Провайдер авторизации.
     * @param {Object} profile - Внешний профиль пользователя.
     * @param {function} done(err, user, message)
     */
    external: function(provider, profile, done) {
        var userData = profile || {};
        userData.provider = provider;
        userData.password = null;
        User.findOne({
            username: userData.username,
            provider: userData.provider
        }).exec(function(err, user) {
            if (err) return done(err);
            if (!user) {
                user = new User(userData);
                user.save(function(err, data) {
                    return done(err, data);
                });
            }
            else {
                if (!user.isActive()) {
                    return done(null, false, {
                        message: 'User is inactive'
                    });
                }
                user.lastLogon = new Date();
                user.save();
                return done(null, user);
            }
        });
    }
};

module.exports = dao;