module.exports = function(server) {
    // https://github.com/cendrizzi/socket.io-docs
    var io = require('socket.io')(server);
    module.exports = io;
    return io;
};