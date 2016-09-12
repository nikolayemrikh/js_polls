/* global webix, $$ */
define("views/admin/room", [
    "models/user",
    "models/time",
], function(user, time) {
    "use strict";
    var uid = webix.uids('ADD_WINDOW', 'ADD_POLL_FORM', 'TABLE', 'POLL_POPUP', 'ANSWER_POLL_FORM',
        'ANSWER_POLL_BTN_SEND', 'VOTED_POPUP', 'VOTED_LIST', 'SHOW_USERS_POPUP', 'SHOW_USERS_LIST');

    var answersCounter = 1;
    var answerInputName = "answer";

    webix.protoUI({
        name: "activeList"
    }, webix.ui.list, webix.ActiveContent);

    function removeAnswerInputs($form, formElements) {
        for (var i = formElements.length - 1; i >= 0; i--) {
            var element = formElements[i];
            if (element.data.name &&
                element.data.name.slice(0, answerInputName.length) == answerInputName &&
                element.data.name != answerInputName + 1) {
                $form.removeView(formElements[i].config.id);
                answersCounter--;
            }
        }
    }

    function pushAnswersInArray(values) {
        var answers = [];
        var tempArr = [];
        for (var elem in values) {
            if (elem.slice(0, answerInputName.length) != answerInputName) continue;
            if (tempArr.indexOf(values[elem]) == -1) {
                answers.push({
                    text: values[elem]
                });
                console.log(answers)
            }
            tempArr.push(values[elem]);
        }
        return answers;
    }

    var addPopup = {
        id: uid.ADD_WINDOW,
        view: "window",
        move: true,
        modal: true,
        width: 640,
        hidden: true,
        maxHeight: window.innerHeight,
        position: "center",
        head: {
            view: "toolbar",
            cols: [{
                view: "label",
                label: "Создать новый опрос"
            }, {
                view: "icon",
                width: 40,
                icon: "check",
                click: function() {
                    var $form = $$(uid.ADD_POLL_FORM);
                    if (!$form.validate()) return;
                    var values = $form.getValues();
                    var args = {
                        name: values.name,
                        description: values.description,
                        date: new Date().toJSON(),
                        answers: pushAnswersInArray(values),
                        creator: user.get("id")
                    };
                    console.log(args)
                    webix.ajax().headers({
                        "Content-type": "application/json"
                    }).post("/api/poll", args).then(function(data) {
                        webix.message("Опрос создан");
                        $$(uid.TABLE).clearAll();
                        $$(uid.TABLE).load("/api/poll");
                    });
                    var elements = $form.getChildViews();
                    removeAnswerInputs($form, elements);
                    $form.clear();
                    this.getTopParentView().hide();
                }
            }, {
                view: "icon",
                icon: "times-circle",
                width: 40,
                click: function() {
                    this.getTopParentView().hide();
                }
            }]
        },
        body: {
            view: "form",
            id: uid.ADD_POLL_FORM,
            elements: [{
                view: "text",
                placeholder: "Название опроса",
                label: "Название",
                name: "name",
                required: true
            }, {
                view: "textarea",
                placeholder: "Подробное описание",
                label: "Описание",
                height: 60,
                name: "description"
            }, {
                view: "text",
                placeholder: "Вариант ответа",
                label: "Вариант ответа",
                name: answerInputName + 1,
                required: true
            }, {
                view: "button",
                value: "Добавить вариант",
                click: function() {
                    var elements = $$(uid.ADD_POLL_FORM).getChildViews();
                    answersCounter++;
                    this.getParentView().addView({
                        view: "text",
                        label: "Вариант ответа",
                        placeholder: "Вариант ответа",
                        name: answerInputName + answersCounter,
                        labelWidth: 200,
                        required: true
                    }, elements.length - 1);
                }
            }],
            elementsConfig: {
                labelWidth: 200
            }
        }
    };

    var pollPopup = {
        id: uid.POLL_POPUP,
        view: "window",
        move: true,
        modal: true,
        width: 640,
        hidden: true,
        maxHeight: window.innerHeight,
        position: "center",
        head: {
            view: "toolbar",
            cols: [{
                view: "label",
                label: "Опрос"
            }, {
                view: "icon",
                icon: "times-circle",
                width: 40,
                click: function() {
                    this.getTopParentView().hide();
                }
            }]
        },
        body: {
            rows: [{
                id: "pollName",
                autoheight: true,
                template: function(poll) {
                    return poll.name;
                }
            }, {
                id: "pollDescription",
                autoheight: true,
                template: function(poll) {
                    return poll.description;
                }
            }, {
                id: "pollCreator",
                autoheight: true,
                template: function(poll) {
                    return "Автор: " + poll.creator.firstname + " " + poll.creator.lastname;
                }
            }, {
                id: "pollDate",
                autoheight: true,
                template: function(poll) {
                    var timeStr;
                    if (poll.date) {
                        timeStr = time.dateToStr(poll.date, "%j %B, " + webix.i18n.timeFormat);
                    }
                    else {
                        timeStr = "";
                    }
                    return timeStr;
                }
            }, {
                view: "form",
                id: uid.ANSWER_POLL_FORM,
                elements: [{
                    id: uid.ANSWER_POLL_BTN_SEND,
                    view: "button",
                    value: "Проголосовать",
                    hidden: true,
                    click: function() {
                        var poll = this.getParentView().config.poll;
                        var answerText = $$("radioView").getValue();
                        if (!answerText) return;

                        var answer = {
                            text: answerText,
                            userToAssign: user.get("id")
                        };
                        webix.ajax().headers({
                            "Content-type": "application/json"
                        }).put("/api/poll/" + poll._id + "?isAssignUser=true", answer).then(function(data) {
                            webix.message("Проголосовано");
                            $$(uid.TABLE).clearAll();
                            $$(uid.TABLE).load("/api/poll");
                            // TODO - обновить число голосовавших после нажатия кнопки
                            /*var options = $$("radioView").config.options;
                            for (var i = 0; i < options.length; i++) {
                                options[i].value = answer.text + " - число проголосовавших: " + answer.assignedUsers.length;
                            }
                            console.log(options, $$("radioView").config.options)*/
                            $$("radioView").config.label = "Результаты";
                            $$("radioView").disable();
                            $$("radioView").refresh();
                            $$(uid.ANSWER_POLL_BTN_SEND).hide();
                        });
                    }
                }],
                elementsConfig: {
                    labelWidth: 200
                }
            }]
        },
        on: {
            doShow: function(poll) {
                $$(uid.ANSWER_POLL_FORM).config.poll = poll;
                $$("pollName").setValues(poll);
                $$("pollDescription").setValues(poll);
                $$("pollCreator").setValues(poll);
                $$("pollDate").setValues(poll);
                // $$("pollTemplate").setValues(poll);
                var radioView = {
                    id: "radioView",
                    name: "radioControl",
                    view: "radio",
                    label: "Варианты ответа",
                    labelWidth: 200,
                    vertical: true,
                    options: []
                };
                var alreadyAssigned = false;
                var userAnswer;
                for (var i = 0; i < poll.answers.length; i++) {
                    var answer = poll.answers[i];
                    var option = {
                        id: answer.text,
                        value: answer.text
                    };
                    if (answer.assignedUsers.indexOf(user.get("id")) != -1) {
                        alreadyAssigned = true;
                        userAnswer = poll.answers[i].text;
                        //Добавим к значению количество ответивших пользователей
                        option.value = answer.text + " - число проголосовавших: " + answer.assignedUsers.length;
                    }
                    radioView.options.push(option);
                }
                if (!alreadyAssigned) {
                    $$(uid.ANSWER_POLL_BTN_SEND).show();
                }
                else {
                    radioView.label = "Результаты";
                    radioView.disabled = true;
                    //Выберем значение, которое выбрал пользователь
                    radioView.value = userAnswer;
                }
                $$(uid.ANSWER_POLL_FORM).addView(radioView, 1);
                this.show();
            },
            onHide: function() {
                $$(uid.ANSWER_POLL_BTN_SEND).hide();
                $$("radioView").config.label = "Варианты ответа";
                $$(uid.ANSWER_POLL_FORM).removeView("radioView");
            }
        }
    };

    function removeRow(row, $table) {
        console.log(row)
        webix.confirm({
            ok: "Удалить",
            cancel: "Отменить",
            text: "Подтвердите удаление",
            type: "confirm-error",
            callback: function(result) {
                if (result) {
                    webix.ajax().del('/api/poll/' + row._id).
                    then(function(data) {
                        $$(uid.TABLE).clearAll();
                        $$(uid.TABLE).load("/api/poll");
                        webix.message("Опрос удален");
                    }).fail(function(err) {
                        webix.message("Ошибка удаления опроса");
                    });
                }
            }
        });
    }

    var ui = {
        type: "space",
        rows: [{
            rows: [{
                view: "toolbar",
                type: "header",
                padding: 5,
                height: 46,
                cols: [{
                    view: "template",
                    gravity: 0.5,
                    css: "title",
                    template: "Все опросы",
                    borderless: true
                }, {
                    view: "button",
                    value: "Добавить опрос",
                    autowidth: true,
                    click: function() {
                        $$(uid.ADD_WINDOW).show();
                    }
                }, {
                    view: "button",
                    value: "Удалить опрос",
                    autowidth: true,
                    click: function() {
                        var $table = $$(uid.TABLE);
                        var selected = $table.getSelectedItem();
                        if (selected) removeRow(selected, $table);
                    }
                }]
            }, {
                id: uid.TABLE,
                view: "datatable",
                resizeColumn: true,
                scroll: "y",
                select: true,
                columns: [{
                        id: "tableName",
                        header: "Название опроса",
                        fillspace: 3,
                        template: function(row) {
                            return "<a class='pollNameLink'>" + row.name + "</a>";
                        }
                    },
                    /*{
                                        id: "tableDescription",
                                        header: "Описание",
                                        fillspace: 3,
                                        template: function(row) {
                                            return "<span class='pollDescriptionLink'>" + row.description + "</span>";
                                        }
                                    },*/
                    {
                        id: "tableCreator",
                        header: "Автор",
                        fillspace: 3,
                        template: function(row) {
                            return "<span class='pollCreatorLink'>" + row.creator.firstname + " " + row.creator.lastname + "</span>";
                        }
                    }, {
                        id: "tableDate",
                        header: "Дата создания",
                        fillspace: 3,
                        template: function(row) {
                            var timeStr;
                            if (row.date) {
                                timeStr = time.dateToStr(row.date, "%j %B, " + webix.i18n.timeFormat);
                            }
                            else {
                                timeStr = "";
                            }
                            return "<span class='pollTimeLink'>" + timeStr + "</span>";
                        }
                    }, {
                        id: "tableAnswersNumbers",
                        header: "Количество вопросов",
                        fillspace: 3,
                        template: function(row) {
                            return "<span class='pollAnswersLink'>" + row.answers.length + "</span>";
                        }
                    }, {
                        id: "tableNumberVoted",
                        header: "Проголосовало",
                        fillspace: 3,
                        template: function(row) {
                            var numberPeopleVoted = 0;
                            for (var i = 0; i < row.answers.length; i++) {
                                var answer = row.answers[i];
                                console.log(answer.assignedUsers.length)
                                numberPeopleVoted += answer.assignedUsers.length;
                            }
                            return "<a class='pollNumberVoted'>" + numberPeopleVoted + "</a>";
                        }
                    }
                ],
                onClick: {
                    pollNameLink: function(e, id) {
                        var poll = this.getItem(id);
                        $$(uid.POLL_POPUP).callEvent('doShow', [poll]);
                    },
                    pollNumberVoted: function(e, id) {
                        // TODO
                        console.log("kek")
                        var poll = this.getItem(id);
                        $$(uid.VOTED_POPUP).callEvent('doShow', [poll]);
                    }
                }
            }]
        }]
    };
    /*template: function(obj, common) {
        return '<div>' +
            '<p>Опрос:</p>' +
            '<p>' + obj.name + '</p>' +
            '<p>' + obj.description + '</p>' +
            '</div>';
    }*/
    var showUsersPopup = {
        id: uid.SHOW_USERS_POPUP,
        body: {
            id: uid.SHOW_USERS_LIST,
            view: "list",
            autoheight: true,
            template: function(obj) {
                return obj.firstname + " " + obj.lastname
            }
        }
    }

    var votedUsersPopup = {
        id: uid.VOTED_POPUP,
        view: "window",
        move: true,
        modal: true,
        width: 640,
        hidden: true,
        maxHeight: window.innerHeight,
        position: "center",
        head: {
            view: "toolbar",
            cols: [{
                view: "label",
                label: "Проголосовавшие пользователи"
            }, {
                view: "icon",
                icon: "times-circle",
                width: 40,
                click: function() {
                    this.getTopParentView().hide();
                }
            }]
        },
        body: {
            view: "activeList",
            id: uid.VOTED_LIST,
            autoheight: true,
            activeContent: {
                showUsersBtn: {
                    view: "button",
                    id: "showUsersBtnId",
                    label: "Показать пользователей",
                    type: "icon",
                    icon: "list",
                    width: 40,
                    popup: String(uid.SHOW_USERS_POPUP),
                    click: function(id, e) {
                        var itemId = $$(uid.VOTED_LIST).locate(e);
                        var item = $$(uid.VOTED_LIST).getItem(itemId);
                        console.log(item)
                        $$(uid.SHOW_USERS_POPUP).show();
                        $$(uid.SHOW_USERS_LIST).parse(item.assignedUsers);
                    }
                }
            },
            template: function(obj, common) {
                return '<div style="display: flex; align-items: center; justify-content: space-around;"><div>Варианто ответа: ' + obj.text + '</div><div> Число проголосовавших: ' + obj.assignedUsers.length + '</div><div>' + common.showUsersBtn(obj, common) + '</div></div>';
            },
            type: {
                height: 46
            }
        },
        on: {
            doShow: function(poll) {
                console.log("test")
                $$(uid.VOTED_LIST).parse(poll.answers);
                this.show();
            }
        }
    }

    return {
        $ui: ui,
        $windows: [addPopup, pollPopup, votedUsersPopup, showUsersPopup],
        $oninit: function(view) {
            $$(uid.TABLE).clearAll();
            $$(uid.TABLE).load("/api/poll");
        }
    };
});