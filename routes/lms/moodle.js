var request = require('request');
var url = require('url');

module.exports = {
    /**
     * Получение списка экзаменов из LMS.
     * 
     * @param {Object} conf - Конфигурациия интегратора.
     * @param {Object} args.user - Данные сессии пользователя.
     * @returns {function} callback(err, data)
     */
    fetch: function(conf, args, callback) {
        var uri = url.resolve(conf.serverURL + "/", "webservice/rest/server.php?wstoken=" +
            conf.wsToken + "&moodlewsrestformat=json" +
            "&wsfunction=core_user_get_users_by_field&field=username&values[0]=" +
            args.user.username);
        request(uri, function(err, res, body) {
            if (err) return callback(err);
            if (res.statusCode == 200) {
                try {
                    var users = JSON.parse(body) || [];
                }
                catch (err) {
                    return callback(err);
                }
                var user = users[0];
                if (!user) return callback();
                uri = url.resolve(conf.serverURL + "/", "webservice/rest/server.php?wstoken=" +
                    conf.wsToken + "&moodlewsrestformat=json" +
                    "&wsfunction=core_enrol_get_users_courses&userid=" + user.id);
                request(uri, function(err, res, body) {
                    if (err) return callback(err);
                    if (res.statusCode == 200) {
                        try {
                            var courses = JSON.parse(body) || [];
                        }
                        catch (err) {
                            return callback(err);
                        }
                        if (!courses.length) return callback();
                        var quiezzesCounter = 0;
                        var exams = [];
                        // Получаем из каждого курса все квизы
                        for (var i in courses) {
                            var course = courses[i];
                            uri = url.resolve(conf.serverURL + "/", "webservice/rest/server.php?wstoken=" +
                                conf.wsToken + "&moodlewsrestformat=json" +
                                "&wsfunction=mod_quiz_get_quizzes_by_courses&courseids[]=" + course.id);
                            request(uri, function(err, res, body) {
                                if (!err && res.statusCode == 200) {
                                    var json = {};
                                    try {
                                        json = JSON.parse(body);
                                    }
                                    catch (err) {}
                                    var quizzes = json.quizzes;
                                    // Для каждого квиза в курсе составляем объект exam, который добавляем в массив экзаменов
                                    for (var k in quizzes) {
                                        var quiz = quizzes[k];
                                        if (!quiz.timelimit) continue;
                                        var exam = {
                                            examId: course.id + "-" + quiz.id,
                                            subject: quiz.name + " (" + course.fullname + ")",
                                            leftDate: new Date(quiz.timeopen * 1000).toJSON(),
                                            rightDate: new Date(quiz.timeclose * 1000).toJSON(),
                                            duration: Math.floor(quiz.timelimit / 60)
                                        };
                                        exams.push(exam);
                                    }
                                }
                                if (++quiezzesCounter === courses.length)
                                    return callback(null, exams);
                            });
                        }
                    }
                    else {
                        return callback(new Error("GET " + uri + " " + res.statusCode));
                    }
                });
            }
            else {
                return callback(new Error("GET " + uri + " " + res.statusCode));
            }
        });
    }
};