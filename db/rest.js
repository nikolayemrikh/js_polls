var dao = {
    /**
     * Создавить запись.
     * 
     * @param {String} args.model - Имя модели БД.
     * @param {Object} args.data - Данные для внесения в БД.
     * @param {Object} [args.populate] - Связь с другими моделями.
     * @param {function} callback(err, data)
     */
    create: function(args, callback) {
        try {
            var model = require('./models/' + args.model);
            model.create(args.data, function(err, data) {
                if (err) return callback(err);
                if (args.populate) data.populate(args.populate, callback);
                else callback(err, data);
            });
        }
        catch (err) {
            return callback(err);
        }
    },
    /**
     * Получить запись или список записей.
     * 
     * @param {String} args.model - Имя модели БД.
     * @param {String} [args.documentId] - Идентификатор документа.
     * @param {Object} [args.filter] - Запрос в формате MongoDB.
     * @param {Object} [args.sort] - Параметры сортировки.
     * @param {Number} [args.skip] - Пропустить N-записей.
     * @param {Number} [args.limit] - Ограничить число записей в выборке.
     * @param {Object} [args.select] - Включить или исключить поля документа.
     * @param {Object} [args.populate] - Связь с другими моделями.
     * @param {function} callback(err, data)
     */
    read: function(args, callback) {
        try {
            var model = require('./models/' + args.model);
            var transaction;
            if (args.documentId) {
                if (args.filter) {
                    args.filter._id = args.documentId;
                    transaction = model.findOne(args.filter);
                }
                else {
                    transaction = model.findById(args.documentId);
                }
                if (args.select) transaction.select(args.select);
                if (args.populate) transaction.populate(args.populate);
                transaction.exec(callback);
            }
            else {
                if (args.filter && args.filter.id) {
                    args.filter._id = args.filter.id;
                    delete args.filter.id;
                }
                transaction = model.find(args.filter);
                if (args.sort) transaction.sort(args.sort);
                if (args.skip) transaction.skip(Number(args.skip));
                if (args.limit) transaction.limit(Number(args.limit));
                if (args.select) transaction.select(args.select);
                if (args.populate) transaction.populate(args.populate);
                transaction.exec(callback);
            }
        }
        catch (err) {
            return callback(err);
        }
    },
    /**
     * Изменить запись.
     * 
     * @param {String} args.model - Имя модели БД.
     * @param {String} args.documentId - Идентификатор документа.
     * @param {Object} args.data - Данные для внесения в БД.
     * @param {function} callback(err, data)
     */
    update: function(args, callback) {
        try {
            var model = require('./models/' + args.model);
            delete args.data.id;
            delete args.data._id;
            var transaction;
            if (args.filter) {
                args.filter._id = args.documentId;
                transaction = model.findOne(args.filter);
            }
            else {
                transaction = model.findById(args.documentId);
            }
            transaction.exec(function(err, data) {
                if (err) return callback(err);
                for (var k in args.data) data[k] = args.data[k];
                data.save(callback);
            });
        }
        catch (err) {
            return callback(err);
        }
    },
    /**
     * Удалить запись.
     * 
     * @param {String} args.model - Имя модели БД.
     * @param {String} args.documentId - Идентификатор документа.
     * @param {function} callback(err, data)
     */
    delete: function(args, callback) {
        try {
            var model = require('./models/' + args.model);
            var transaction;
            if (args.filter) {
                args.filter._id = args.documentId;
                transaction = model.findOne(args.filter);
            }
            else {
                transaction = model.findById(args.documentId);
            }
            transaction.exec(function(err, data) {
                if (err) return callback(err);
                data.remove(callback);
            });
        }
        catch (err) {
            return callback(err);
        }
    }
};

module.exports = dao;