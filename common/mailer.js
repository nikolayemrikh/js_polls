var nodemailer = require('nodemailer');
var config = require('nconf');

var options = config.get('email:options');
var transporter = nodemailer.createTransport(options);

module.exports = transporter;