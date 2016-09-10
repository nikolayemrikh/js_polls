var config = require('nconf');
var Agenda = require('agenda');
var agenda = new Agenda({
    maxConcurrency: 100,
    db: {
        address: config.get('mongodb:uri'),
        collection: 'jobs'
    }
});

var jobTypes = process.env.JOB_TYPES ? process.env.JOB_TYPES.split(',') : [];

jobTypes.forEach(function(type) {
    require('./jobs/' + type)(agenda);
});

agenda.on('ready', function() {
    if (jobTypes.length) {
        agenda.start();
    }
});

module.exports = agenda;