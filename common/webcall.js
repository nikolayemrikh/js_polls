/**
 * Webcall - модуль видеосвязи.
 * 
 * @param {Socket} socket - socket.io
 */

module.exports = function(socket) {
    /*
     * Объявление глобальных переменных.
     */
    var config = require('nconf');
    var kurento = require('kurento-client');
    var userRegistry = new UserRegistry();
    var kurentoClients = null;

    /**
     * Конструктор сессии пользователя.
     * 
     * @param {Socket} ws - Сокет.
     * @param {String} id - Идентификатор сессии.
     * @param {Object|String} [data] - Дополнительные пользовательские данные.
     */
    function UserSession(ws, id, data) {
        this.ws = ws;
        this.id = id;
        this.data = data;
        this.dispose();
    }
    /**
     * Освободить ресурсы сессии.
     * 
     * @param {boolean} released - Флаг, что сессия уже освобождена.
     */
    UserSession.prototype.dispose = function(released) {
        if (!released) {
            if (this.recorder) this.recorder.stop();
            if (this.webrtc) this.webrtc.release();
            if (this.pipeline) this.pipeline.release();
        }
        if (this.ws && this.stream) {
            this.ws.emit('stopCommunication', {
                id: this.id
            });
        }
        this.uri = null;
        this.viewers = {};
        this.presenter = null;
        this.pipeline = null;
        this.webrtc = null;
        this.recorder = null;
        this.candidatesQueue = [];
    };
    /**
     * Рассылка оповещений по пространствам имен пользователя.
     * 
     * Если идентификатор пользователя соответствует пространству имен
     * "room1.user1.camera1", то рассылка оповещения будет выполнена для
     * комнат "room1.user1.camera1", "room1.user1" и "room1".
     *
     * Для получения оповещений пользователь должен быть подключен
     * к соответствующей комнате.
     * 
     * @param {String} event - Имя события.
     */
    UserSession.prototype.notify = function(event) {
        if (!event) return;
        var nodes = this.id.split('.');
        socket.to(nodes[0]).emit(event, {
            event: event,
            id: this.id,
            nodes: nodes,
            data: this.data || this.stream
        });
        // var last = nodes[nodes.length - 1];
        // while (nodes.length) {
        //     var room = nodes.join('.');
        //     socket.to(room).emit(event, {
        //         event: event,
        //         id: this.id,
        //         nodes: nodes,
        //         data: this.data || this.stream
        //     });
        //     nodes.pop();
        // }
    };

    /**
     * Конструктор реестра пользовательских сессий.
     */
    function UserRegistry() {
        this.users = {};
        this.rooms = {};
    }
    /**
     * Зарегистрировать пользовательскую сессию в реестре.
     * 
     * @param {UserSession} user - Экземпляр сессии пользователя.
     * @param {String} [event] - Отправить указанное оповещение, если задано.
     * @returns {Boolean} - Удалось зарегистрировать или нет.
     */
    UserRegistry.prototype.register = function(user, event) {
        if (!user || !user.id || !user.ws) return false;
        this.users[user.id] = user;
        var nodes = user.id.split('.');
        nodes.reduce(function(obj, i) {
            if (obj) {
                if (!obj[i]) obj[i] = {};
                return obj[i];
            }
        }, this.rooms);
        user.notify(event);
        return true;
    };
    /**
     * Разрегистрировать пользовательскую сессию.
     * 
     * @param {UserSession} user - Экземпляр сессии пользователя.
     * @param {String} [event] - Отправить указанное оповещение, если задано.
     * @returns {Boolean} - Удалось разрегистрировать или нет.
     */
    UserRegistry.prototype.unregister = function(user, event) {
        if (!user || !user.id || !user.ws) return false;
        delete this.users[user.id];
        var nodes = user.id.split('.');
        while (nodes.length) {
            var id = nodes.join('.');
            if (this.getUser(id)) break;
            nodes.reduce(function(obj, i) {
                if (obj) {
                    if (obj[i] && !Object.keys(obj[i]).length) delete obj[i];
                    return obj[i];
                }
            }, this.rooms);
            nodes.pop();
        }
        user.notify(event);
        return true;
    };
    /**
     * Получить пользовательскую сессию по ее идинтификатору.
     * 
     * @param {String} id - Идентификатор сессии.
     * @returns {UserSession} - Экземпляр сессии пользователя.
     */
    UserRegistry.prototype.getUser = function(id) {
        if (id) return this.users[id];
    };
    /**
     * Получить содержимое указанной комнаты.
     *
     * @param {String} id - Идентификатор комнаты.
     * @returns {Object} - Объект, содержашийся в комнате.
     */
    UserRegistry.prototype.getRoom = function(id) {
        if (!id) return;
        return id.split('.').reduce(function(obj, i) {
            if (obj) return obj[i];
        }, this.rooms);
    };
    /**
     * Получить список сессий, находящихся в указанной комнате.
     * 
     * @param {String} id - Идентификатор комнаты.
     * @returns {Object[]} - Массив пользовательских сессий.
     */
    UserRegistry.prototype.listOfRoom = function(id) {
        if (!id) return;
        var room = this.getRoom(id) || {};
        var self = this;
        return Object.keys(room).reduce(function(arr, node) {
            var user = self.getUser([id, node].join('.'));
            if (user) arr.push({
                id: id,
                nodes: id.split('.'),
                childs: [],
                data: user.data || user.stream
            });
            return arr;
        }, []);
    };
    /**
     * Получить дерево комнат, начиная с указанной.
     * 
     * @param {String} id - Идентификатор комнаты.
     * @returns {Object} - Объект с комнатами.
     */
    UserRegistry.prototype.treeOfRoom = function(id) {
        if (!id) return;
        var room = this.getRoom(id) || {};
        var childs = Object.keys(room);
        var user = this.getUser(id) || {};
        var out = {
            id: id,
            nodes: id.split('.'),
            childs: [],
            data: user.data || user.stream
        };
        for (var i = 0, l = childs.length; i < l; i++) {
            var child = this.treeOfRoom([id, childs[i]].join('.'));
            out['childs'].push(child);
        }
        return out;
    };

    /**
     * Определение параметров WebRtc.
     * 
     * @param {String} id - Идентификатор трансляции.
     * @param {String} mediaProfile - Если задан, то включается запись 
     *    (возможные варианты: WEBM, WEBM_VIDEO_ONLY, WEBM_AUDIO_ONLY).
     */
    function getEndpointParams(id, mediaProfile) {
        var webRtcParams = [{
            type: 'WebRtcEndpoint',
            params: {}
        }];
        if (mediaProfile) {
            webRtcParams.push({
                type: 'RecorderEndpoint',
                params: {
                    uri: config.get('kurento:storage') + Date.now() + '_' + id + '.webm',
                    mediaProfile: mediaProfile,
                    stopOnEndOfStream: true
                }
            });
        }
        return webRtcParams;
    }

    /**
     * Запустить трансляцию.
     * 
     * @param {Socket} ws - Сокет.
     * @param {Object} message - Данные от клиента.
     * @param {PresenterCallback} callback
     * 
     * @callback PresenterCallback
     * @param {Object} message.sdpAnswer - SDP ответ в случае установки соединения.
     * @param {String} message.error - Текст ошибки в случае возникновения ошибки.
     */
    function startPresenter(ws, message, callback) {

        function onError(error) {
            stop(ws, message.id);
            callback({
                error: error
            });
        }

        if (!message.id) return onError('empty identificator');
        var presenter = userRegistry.getUser(message.id);
        if (presenter) return onError('presenter is already active');

        presenter = new UserSession(ws, message.id, message.data);
        presenter.stream = 'presenter';
        userRegistry.register(presenter);

        getKurentoClient(function(error, uri, kurentoClient) {
            if (error) return onError(error);

            presenter.uri = uri;

            kurentoClient.create('MediaPipeline', function(error, pipeline) {
                if (error) return onError(error);

                presenter.pipeline = pipeline;

                pipeline.create(getEndpointParams(presenter.id, message.mediaProfile), function(error, elements) {
                    if (error) return onError(error);

                    var webrtc = elements[0];
                    var recorder = elements[1];

                    presenter.webrtc = webrtc;

                    while (presenter.candidatesQueue.length) {
                        var candidate = presenter.candidatesQueue.shift();
                        webrtc.addIceCandidate(candidate);
                    }

                    webrtc.on('OnIceCandidate', function(event) {
                        var candidate = kurento.register.complexTypes.IceCandidate(event.candidate);
                        presenter.ws.emit('iceCandidate', {
                            id: presenter.id,
                            candidate: candidate
                        });
                    });

                    webrtc.once('MediaStateChanged', function(event) {
                        if (event.newState === 'CONNECTED') {
                            presenter.notify('started');
                        }
                    });

                    if (recorder) {
                        webrtc.connect(recorder, function(error) {
                            if (error) return onError(error);
                            recorder.record(function(error) {
                                if (error) return onError(error);
                                presenter.recorder = recorder;
                            });
                        });

                    }

                    webrtc.processOffer(message.sdpOffer, function(error, sdpAnswer) {
                        if (error) return onError(error);
                        webrtc.gatherCandidates(function(error) {
                            if (error) return onError(error);
                        });
                        callback({
                            sdpAnswer: sdpAnswer
                        });
                    });

                });
            });
        });
    }

    /**
     * Воспроизвести трансляцию.
     * 
     * @param {Socket} ws - Сокет.
     * @param {Object} message - Данные от клиента.
     * @param {ViewerCallback} callback
     * 
     * @callback ViewerCallback
     * @param {Object} message.sdpAnswer - SDP ответ в случае установки соединения.
     * @param {String} message.error - Текст ошибки в случае возникновения ошибки.
     */
    function startViewer(ws, message, callback) {

        function onError(error) {
            stop(ws, message.id);
            callback({
                error: error
            });
        }

        if (!message.id || !message.presenter) return onError('empty identificator');
        var presenter = userRegistry.getUser(message.presenter);
        if (!presenter) return onError('presenter is not active');
        if (!presenter.pipeline) return onError('no media pipeline');
        var viewer = userRegistry.getUser(message.id);
        if (viewer) return onError('viewer is already active');

        viewer = new UserSession(ws, message.id, message.data);
        viewer.stream = 'viewer';
        viewer.presenter = presenter;
        userRegistry.register(viewer);

        presenter.pipeline.create('WebRtcEndpoint', function(error, webRtcEndpoint) {
            if (error) return onError(error);

            viewer.webrtc = webRtcEndpoint;
            presenter.viewers[viewer.id] = viewer;

            while (viewer.candidatesQueue.length) {
                var candidate = viewer.candidatesQueue.shift();
                webRtcEndpoint.addIceCandidate(candidate);
            }

            webRtcEndpoint.on('OnIceCandidate', function(event) {
                var candidate = kurento.register.complexTypes.IceCandidate(event.candidate);
                viewer.ws.emit('iceCandidate', {
                    id: viewer.id,
                    candidate: candidate
                });
            });

            webRtcEndpoint.once('MediaStateChanged', function(event) {
                if (event.newState === 'CONNECTED') {
                    viewer.notify('started');
                }
            });

            webRtcEndpoint.processOffer(message.sdpOffer, function(error, sdpAnswer) {
                if (error) return onError(error);
                presenter.webrtc.connect(webRtcEndpoint, function(error) {
                    if (error) return onError(error);
                    webRtcEndpoint.gatherCandidates(function(error) {
                        if (error) return onError(error);
                    });
                    callback({
                        sdpAnswer: sdpAnswer
                    });
                });
            });
        });
    }

    /**
     * Остановить трансляцию или ее воспроизведение.
     * 
     * @param {Socket} ws - Сокет.
     * @param {String} id - Идентификатор сессии.
     */
    function stop(ws, id) {
        var user = userRegistry.getUser(id);
        if (!user || ws != null && user.ws.id !== ws.id) return;
        // если это presenter, то остановить все viewer
        for (var i in user.viewers) {
            var viewer = user.viewers[i];
            viewer.dispose(!ws);
            delete user.viewers[i];
            userRegistry.unregister(viewer, 'stopped');
        }
        // если это viewer, то удалить себя из presenter
        if (user.presenter && user.presenter.viewers) {
            delete user.presenter.viewers[user.id];
        }
        user.dispose(!ws);
        userRegistry.unregister(user, 'stopped');
    }

    /**
     * Остановить все трансляции на указанном сокете.
     * 
     * @param {Socket} ws - Сокет.
     * @param {String} [uri]- Адрес сервера KMS.
     */
    function stopAll(ws, uri) {
        for (var k in userRegistry.users) {
            var user = userRegistry.users[k];
            if (uri && user.uri !== uri) continue;
            if (user.stream) stop(ws, k);
            else {
                if (user.ws.id !== ws.id) continue;
                userRegistry.unregister(user, 'unregistered');
            }
        }
    }

    /**
     * Обработчик входящих ICE-кандидатов.
     * 
     * @param {String} message.id - Идентификтор сессии.
     * @param {Object} damessageta.candidate - ICE кандидат.
     */
    function addIceCandidate(message) {
        if (!message.id) return;
        var candidate = kurento.register.complexTypes.IceCandidate(message.candidate);
        var user = userRegistry.getUser(message.id);
        if (user) {
            if (user.webrtc) user.webrtc.addIceCandidate(candidate);
            else user.candidatesQueue.push(candidate);
        }
    }

    /**
     * Получить клиент Kurento.
     * 
     * @param {KurentoClientCallback} callback
     * @param {Array} [ws_arr] - Массив адресов для подключения.
     * 
     * @callback KurentoClientCallback
     * @param {String} error - Сообщение об ошибке, если есть.
     * @param {Object} kurentoClient - Экземпляр клиента Kurento.
     */
    function getKurentoClient(callback, ws_arr) {
        if (kurentoClients == null) {
            ws_arr = [].concat(config.get('kurento:ws'));
            if (!ws_arr.length) return callback(new Error('KMS address not set'));
            kurentoClients = ws_arr.reduce(function(obj, uri) {
                obj[uri] = null;
                return obj;
            }, {});
        }
        if (!ws_arr) ws_arr = Object.keys(kurentoClients);
        var index = Math.round(Math.random() * (ws_arr.length - 1));
        var ws_uri = ws_arr.splice(index, 1)[0];
        var kurentoClient = kurentoClients[ws_uri];
        if (kurentoClient) {
            return callback(null, ws_uri, kurentoClient);
        }
        var options = config.get('kurento:options');
        kurento(ws_uri, options, function(error, kurentoClient) {
            if (error) {
                console.error('Coult not find media server at address ' + ws_uri);
                if (!ws_arr.length) return callback(error);
                return setTimeout(getKurentoClient.bind(null, callback, ws_arr), 0);
            }
            kurentoClient.on('disconnect', function() {
                kurentoClients[ws_uri] = null;
                stopAll(null, ws_uri);
            });
            kurentoClients[ws_uri] = kurentoClient;
            callback(null, ws_uri, kurentoClient);
        });
    }

    /*
     * Установить обработчики событий на сокет.
     */
    socket.on('connection', function(ws) {
        ws.on('disconnect', function() {
            stopAll(ws);
        });
        ws.on('iceCandidate', function(message) {
            addIceCandidate(message);
        });
        ws.on('presenter', function(message, callback) {
            startPresenter(ws, message, callback);
        });
        ws.on('viewer', function(message, callback) {
            startViewer(ws, message, callback);
        });
        ws.on('stop', function(message) {
            stop(ws, message.id);
        });
        ws.on('lookup', function(id, callback) {
            // if (callback) callback(userRegistry.listOfRoom(id));
            if (callback) callback(userRegistry.treeOfRoom(id));
        });
        ws.on('userdata', function(message) {
            if (!message || !message.event || !message.id) return;
            message.nodes = message.id.split('.');
            socket.to(message.id).emit(message.event, message);
        });
        ws.on('register', function(message, callback) {
            callback = callback || function() {};
            if (!message || !message.id) return callback();
            var nodes = message.id.split('.');
            ws.join(nodes[0]);
            if (!userRegistry.getUser(message.id)) {
                var user = new UserSession(ws, message.id, message.data);
                if (userRegistry.register(user, 'registered')) {
                    message.nodes = nodes;
                    return callback(message);
                }
            }
            callback();
        });
        ws.on('unregister', function(message, callback) {
            callback = callback || function() {};
            if (!message || !message.id) return callback();
            var nodes = message.id.split('.');
            ws.leave(nodes[0]);
            var user = userRegistry.getUser(message.id);
            if (user && user.ws && user.ws.id === ws.id) {
                if (userRegistry.unregister(user, 'unregistered')) {
                    message.nodes = nodes;
                    return callback(message);
                }
            }
            callback();
        });
    });
};