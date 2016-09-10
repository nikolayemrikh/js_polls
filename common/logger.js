var winston = require('winston');

var logger = new(winston.Logger)({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    transports: [
        new(winston.transports.Console)({
            timestamp: true,
            colorize: true,
        })
    ],
    exceptionHandlers: [
        new(winston.transports.Console)({
            timestamp: true,
            handleExceptions: true,
            humanReadableUnhandledException: true
        })
    ],
    exitOnError: false
});

logger.stream = {
    write: function(message, encoding) {
        logger.info(message.slice(0, -1));
    }
};

logger.db = function(collectionName, method, query, doc, options) {
    // LOG format: Mongoose: rooms.find({ student: ObjectId("55633e000cf842a221a37ae3") }) { sort: { beginDate: 1 }, fields: undefined } 
    logger.debug('Mongoose: %s.%s(%s) %s', collectionName, method, JSON.stringify(query), JSON.stringify(doc));
};

module.exports = logger;