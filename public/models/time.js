/**
 * Модель точного серверного времени и функции для работы с датами.
 */

/* global webix */

define("models/time", function(translate) {
    'use strict';

    var DEVIATION = 30000; // milliseconds 

    var diff;
    var ticker = Date.now();
    setInterval(function() {
        ticker += 1000;
        if (diff) {
            if (Math.abs(Date.now() + diff - ticker) > DEVIATION) time.sync();
        }
    }, 1000);

    var time = {
        sync: function() {
            webix.ajax().get('/tools/time', {
                client: Date.now()
            }).then(function(data) {
                var time = data.json();
                ticker = time.serverTime;
                diff = time.diff;
                console.log('Time diff: ' + diff + ' ms');
            }).fail(function() {
                diff = null;
            });
        },
        now: function(format, utc) {
            var now = new Date(ticker);
            if (format) {
                var formatter = webix.Date.dateToStr(format, utc);
                return formatter(now);
            }
            return now;
        },
        dateToStr: function(date, format, utc) {
            var formatter = webix.Date.dateToStr(format, utc);
            return formatter(new Date(date));
        },
        strToDate: function(str, format, utc) {
            var parser = webix.Date.strToDate(format, utc);
            return parser(str);
        }
    };

    return time;
});