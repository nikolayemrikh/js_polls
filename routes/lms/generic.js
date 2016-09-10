var request = require('request');
var ejs = require('ejs');

/**
 * Перебор всех полей сложных объектов.
 * 
 * @param {Object} obj - Объект.
 * @param {function} callback(obj, key) - Вызывается для каждого поля.
 */
function forEachNestedObjects(obj, callback) {
    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
            if (typeof obj[key] === 'object')
                forEachNestedObjects(obj[key], callback);
            else callback(obj, key);
        }
    }
}

/**
 * Рендринг всех текстовых полей объекта шаблонизатором EJS.
 * 
 * @param {Object} obj - Преобразуемые данные (шаблоны).
 * @param {Object} data - Данные для подстановки в шаблон.
 */
function renderAll(obj, data) {
    if (!obj) return;
    try {
        var clone = JSON.parse(JSON.stringify(obj));
        forEachNestedObjects(clone, function(obj, key) {
            if (typeof obj[key] === 'string') {
                obj[key] = ejs.render(obj[key], data);
            }
        });
        return clone;
    }
    catch (e) {
        return;
    }
}

module.exports = {
    /**
     * Получение списка экзаменов из LMS.
     * 
     * @param {Object} conf - Конфигурациия интегратора.
     * @param {Object} args.user - Данные сессии пользователя.
     * @returns {function} callback(err, data)
     */
    fetch: function(conf, args, callback) {
        var method = conf.fetch.method || 'GET';
        var headers = conf.fetch.headers || conf.headers;
        var uri = ejs.render(conf.fetch.uri, args);
        var response = conf.fetch.response;
        var json = renderAll(conf.fetch.request, args);
        request({
            method: method,
            uri: uri,
            headers: headers,
            json: json
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
                var exams = [];
                for (var i = 0, l = body.length; i < l; i++) {
                    var exam = renderAll(response, body[i]);
                    if (exam) exams.push(exam);
                }
                callback(null, exams);
            }
            else {
                return callback(new Error(method + " " + uri + " " + res.statusCode));
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
        var method = conf.start.method || 'GET';
        var headers = conf.start.headers || conf.headers;
        var uri = ejs.render(conf.start.uri, args);
        var json = renderAll(conf.start.request, args);
        request({
            method: method,
            uri: uri,
            headers: headers,
            json: json
        }, function(err, res, body) {
            if (err) return callback(err);
            if (res.statusCode == 200) {
                callback();
            }
            else {
                return callback(new Error(method + " " + uri + " " + res.statusCode));
            }
        });
    },
    /**
     * Отправка запроса в LMS о завершении экзамена.
     * 
     * @param {Object} conf - Конфигурациия интегратора.
     * @param {Object} args.user - Данные сессии пользователя.
     * @param {Object} args.room - Данные текущей комнаты.
     * @returns {function} callback(err, data)
     */
    finish: function(conf, args, callback) {
        var method = conf.finish.method || 'GET';
        var headers = conf.finish.headers || conf.headers;
        var uri = ejs.render(conf.finish.uri, args);
        var json = renderAll(conf.finish.request, args);
        request({
            method: method,
            uri: uri,
            headers: headers,
            json: json
        }, function(err, res, body) {
            if (err) return callback(err);
            if (res.statusCode == 200) {
                callback();
            }
            else {
                return callback(new Error(method + " " + uri + " " + res.statusCode));
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
        var method = conf.state.method || 'GET';
        var headers = conf.state.headers || conf.headers;
        var uri = ejs.render(conf.state.uri, args);
        var response = conf.state.response;
        var json = renderAll(conf.state.request, args);
        request({
            method: method,
            uri: uri,
            headers: headers,
            json: json
        }, function(err, res, body) {
            if (err) return callback(err);
            if (res.statusCode == 200) {
                try {
                    body = JSON.parse(body);
                }
                catch (err) {
                    return callback(new Error("api." + args.user.provider +
                        ".state: Received an invalid JSON format"));
                }
                callback(null, renderAll(response, body));
            }
            else {
                return callback(new Error(method + " " + uri + " " + res.statusCode));
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
        var method = conf.submit.method || 'POST';
        var headers = conf.submit.headers || conf.headers;
        var uri = ejs.render(conf.submit.uri, args);
        var json = renderAll(conf.submit.request, args);
        request({
            method: method,
            uri: uri,
            headers: headers,
            json: json
        }, function(err, res, body) {
            if (err) return callback(err);
            if (res.statusCode == 200) {
                callback();
            }
            else {
                return callback(new Error(method + " " + uri + " " + res.statusCode));
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
        var headers = conf.metadata.headers || conf.headers;
        if (headers) {
            // check access premissions
            for (var key in headers) {
                if (headers[key] !== args.headers[key.toLowerCase()]) {
                    return callback(403);
                }
            }
        }
        var request = renderAll(conf.metadata.request, args.body);
        args.update(request, function(err, data) {
            if (err) return callback(400);
            var response = renderAll(conf.metadata.response, data);
            callback(200, response);
        });
    }
};