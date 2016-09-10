/* global atob, File */

define("helpers/utils", [
    "models/time"
], function(time) {
    'use strict';

    return {
        /**
         * Генератор идентификаторов RFC4122 v4 (random).
         */
        uuid: function() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random() * 16 | 0,
                    v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        },
        /**
         * Вычислить статус сеанса
         *  1 - Не запланирован
         *  2 - Запланирован
         *  3 - Ожидает
         *  4 - Идет
         *  5 - Пропущен
         *  6 - Завершен
         *  7 - Принят
         *  8 - Отклонен
         * 
         * @param {Object} record Данные сеанса
         * @returns {Number} Номер статуса
         */
        parseStatus: function(record) {
            var status = 1;
            var now = time.now();
            if (record.rightDate) {
                var rightDate = new Date(record.rightDate);
                if (rightDate <= now) status = 5;
            }
            if (record.beginDate && record.endDate) {
                var beginDate = new Date(record.beginDate);
                var endDate = new Date(record.endDate);
                if (beginDate > now) status = 2;
                if (endDate <= now) status = 5;
                if (beginDate <= now && endDate > now) status = 3;
                if (beginDate <= now && record.startDate) status = 4;
                if (beginDate <= now && record.stopDate) status = 6;
                if (record.resolution === 'accepted') status = 7;
                if (record.resolution === 'rejected') status = 8;
            }
            return status;
        },
        /**
         * Фильтр полнотекстового поиска по объекту
         * 
         * @param {String} text Тектовая строка для поиска
         * @param {Object} data Данные, в которых осущетсвлять поиск
         * @returns {Boolean} Фильтровать запись или нет
         */
        fulltextFilter: function(text, data) {
            if (!text) return true;
            var objectToString = function(obj) {
                var result = "";
                if (obj instanceof Array) {
                    for (var i = 0; i < obj.length; i++) {
                        result += objectToString(obj[i]);
                    }
                }
                else {
                    for (var prop in obj) {
                        if (obj[prop] instanceof Object || obj[prop] instanceof Array) {
                            result += objectToString(obj[prop]);
                        }
                        if (typeof obj[prop] === 'string') result += obj[prop] + " ";
                    }
                }
                return result;
            };
            var phrases = text.toLowerCase().split(' ');
            var str = objectToString(data).toLowerCase();
            var cond = true;
            for (var j = 0, lj = phrases.length; j < lj; j++) {
                if (str.search(phrases[j]) === -1) {
                    cond = false;
                    break;
                }
            }
            return cond;
        },
        /**
         * Преобразование DataURL в объект File
         * 
         * @param {String} dataUrl Тело файла в формате DataURL
         * @param {String} filename Имя файла
         * @param {String} type Тип файла в mime
         * @returns {File}
         */
        dataUrlToFile: function(dataUrl, filename, type) {
            var blobBin = atob(dataUrl.split(',')[1]);
            var array = [];
            for (var i = 0, l = blobBin.length; i < l; i++) {
                array.push(blobBin.charCodeAt(i));
            }
            return new File([new Uint8Array(array)], filename, {
                type: type
            });
        },
        /**
         * Преобразование снимка видео в DataURL
         * 
         * @param {Element} video Видео элемент
         * @param {Number} scale Коэффициент масштабирования
         * @returns {String} Снимок в формате DataURL
         */
        videoToDataUrl: function(video, scale) {
            scale = scale ? scale : 1;
            var canvas = document.createElement("canvas");
            canvas.width = video.videoWidth * scale;
            canvas.height = video.videoHeight * scale;
            canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
            return canvas.toDataURL();
        },
        /**
         * Получение кода ответа без загрузки содержимого
         *
         * @param {String} url Адрес для проверки
         * @param {function} callback(status)
         */
        getHttpCode: function(url, callback) {
            var http = new XMLHttpRequest();
            http.open('HEAD', url);
            http.onreadystatechange = function() {
                if (this.readyState == this.DONE) {
                    callback(this.status);
                }
            };
            http.send();
        },
        /**
         * Загрузить файл на сервер
         * 
         * @param {File} file - Загружаемый файл
         * @param {function} callback(data)
         */
        uploadFile: function(file, callback) {
            var formData = new FormData();
            formData.append("upload", file);
            var xhr = new XMLHttpRequest();
            xhr.open('POST', '/storage', true);
            xhr.onload = function() {
                if (callback) callback(JSON.parse(this.responseText));
            };
            xhr.send(formData);
        },
        /**
         * Отправить сообщение в расширение или приложение
         * 
         * @param {Object} message - Передаваемое сообщение
         * @param {String} message.id - Идентификатор сообщения
         * @param {String} targetOrigin - Адрес назначения, например '*'
         */
        postMessage: function(message, targetOrigin, transfer) {
            var win = window.win || window;
            win.window.postMessage(message, targetOrigin, transfer);
        },
        /**
         * Обрезать текст до заданной длины, добавив многоточие.
         *
         * @param {String} text - Текст, который нужно обрезать.
         * @param {Number} length - Допустимая длина текста.
         * @param {Boolean} ext - Оставлять расширение в имени файла.
         */
        truncateText: function(text, length, ext) {
            if (ext) {
                ext = ~text.indexOf('.') ? text.split('.').pop() : '';
            }
            else ext = '';
            if (text.length > length) {
                text = text.substring(0, length - ext.length) + '...' + ext;
            }
            return text;
        },
    };
});