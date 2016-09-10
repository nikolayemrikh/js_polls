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
        var uri = url.resolve(conf.serverURL + "/",
            "api/extended/user_proctored_exams/" +
            args.user.username + "/?format=json");
        request.get({
            uri: uri,
            headers: {
                "X-Edx-Api-Key": conf.apiKey
            }
        }, function(err, res, body) {
            if (err) return callback(err);
            if (res.statusCode == 200) {
                try {
                    body = JSON.parse(body);
                }
                catch (err) {
                    return callback(new Error("api." + args.user.provider +
                        ".fetch: Received an invalid JSON format"));
                }
                var arr = [];
                for (var k in body) {
                    var exams = body[k].exams || [];
                    for (var i = 0, li = exams.length; i < li; i++) {
                        if (exams[i].is_active && exams[i].is_proctored) {
                            arr.push({
                                examId: exams[i].course_id + '-' + exams[i].id,
                                leftDate: body[k].start,
                                rightDate: body[k].end,
                                subject: body[k].name + ' (' + exams[i].exam_name + ')',
                                duration: exams[i].time_limit_mins
                            });
                        }
                    }
                }
                callback(null, arr);
            }
            else {
                return callback(new Error("GET " + uri + " " + res.statusCode));
            }
        });
    },
    /**
     * Отправка запроса в LMS о начале экзамена.
     * 
     * @param {Object} conf - Конфигурациия интегратора.
     * @param {Object} args.user - Данные сессии пользователя.
     * @param {Object} args.room - Данные текущей комнаты.
     * @returns {function} callback(err, data)
     */
    start: function(conf, args, callback) {
        var metadata = conf.room.metadata || {};
        var uri = url.resolve(conf.serverURL + "/",
            "api/edx_proctoring/proctoring_launch_callback/start_exam/" +
            metadata.examCode);
        request.get({
            uri: uri,
            headers: {
                'X-Edx-Api-Key': conf.apiKey
            }
        }, function(err, res, body) {
            if (err) return callback(err);
            if (res.statusCode != 200) {
                return callback(new Error("GET " + uri + " " + res.statusCode));
            }
        });
    },
    /**
     * Запрос статуса экзамена в LMS.
     * 
     * @param {Object} conf - Конфигурациия интегратора.
     * @param {Object} args.user - Данные сессии пользователя.
     * @param {Object} args.room - Данные текущей комнаты.
     * @returns {function} callback(err, data)
     */
    state: function(conf, args, callback) {
        var metadata = conf.room.metadata || {};
        var uri = url.resolve(conf.serverURL + "/",
            "api/edx_proctoring/proctoring_poll_status/" +
            metadata.examCode + "?format=json");
        request.get({
            uri: uri,
            headers: {
                'X-Edx-Api-Key': conf.apiKey
            }
        }, function(err, res, body) {
            if (err) return callback(err);
            if (res.statusCode == 200) {
                try {
                    body = JSON.parse(body);
                    callback(null, {
                        interval: conf.stateInterval,
                        state: body.status
                    });
                }
                catch (err) {
                    return callback(new Error("api." + args.user.provider +
                        ".fetch: Received an invalid JSON format"));
                }
            }
            else {
                return callback(new Error("GET " + uri + " " + res.statusCode));
            }
        });
    },
    /**
     * Отправка в LMS заключения проктора.
     * 
     * @param {Object} conf - Конфигурациия интегратора.
     * @param {Object} args.user - Данные сессии пользователя.
     * @param {Object} args.room - Данные текущей комнаты.
     * @returns {function} callback(err, data)
     */
    submit: function(conf, args, callback) {
        var metadata = conf.room.metadata || {};
        var uri = url.resolve(conf.serverURL + "/",
            "api/edx_proctoring/proctoring_review_callback/");
        var data = {
            examMetaData: {
                examCode: metadata.examCode,
                ssiRecordLocator: args.room.id,
                reviewedExam: args.room.resolution,
                reviewerNotes: args.room.comment
            },
            examApiData: {
                orgExtra: {
                    examStartDate: args.room.startDate,
                    examEndDate: args.room.stopDate
                }
            },
            // reviewStatus: 'Clean', 'Rules Violation', 'Not Reviewed', 'Suspicious'
            reviewStatus: args.room.resolution === 'accepted' ? 'Clean' : 'Suspicious',
            videoReviewLink: ''
        };
        request.post({
            uri: uri,
            json: data,
            headers: {
                'X-Edx-Api-Key': conf.apiKey
            }
        }, function(err, res, body) {
            if (err) return callback(err);
            if (res.statusCode != 200) {
                return callback(new Error("GET " + uri + " " + res.statusCode));
            }
        });
    },
    /**
     * Обновление метаданных комнаты.
     * 
     * @param {Object} conf - Конфигурациия интегратора.
     * @param {Object} args.headers - Заголовки запроса.
     * @param {Object} args.body - Тело запроса.
     * @param {function} args.update - Функция обновления метаданных.
     * @returns {function} callback(statusCode, data)
     */
    metadata: function(conf, args, callback) {
        var orgExtra = args.body.orgExtra || {};
        var data = {
            provider: conf.authProvider,
            username: orgExtra.username,
            examId: orgExtra.courseID + '-' + orgExtra.examID,
            examCode: args.body.examCode
        };
        if (!data.provider || !data.username ||
            !data.examId || !data.examCode) {
            return callback(400);
        }
        args.update(request, function(err, data) {
            if (err) return callback(400);
            var response = {
                sessionId: data.id
            };
            callback(200, response);
        });
    }
};