/* global webix, $$ */
define("views/admin/room", [
    "models/user",
    "models/time",
], function(user, time) {
    "use strict";
    var uid = webix.uids('ADD_WINDOW', 'ADD_FORM', 'TABLE');

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
        for (var elem in values) {
            if (elem.slice(0, answerInputName.length) == answerInputName) {
                answers.push({
                    text: values[elem]
                });
            }
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
                    var $form = $$(uid.ADD_FORM);
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
            id: uid.ADD_FORM,
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
                name: answerInputName + 1
            }, {
                view: "button",
                value: "Добавить вариант",
                click: function() {
                    var elements = $$(uid.ADD_FORM).getChildViews();
                    answersCounter++;
                    this.getParentView().addView({
                        view: "text",
                        label: "Вариант ответа",
                        placeholder: "Вариант ответа",
                        name: answerInputName + answersCounter,
                        labelWidth: 200
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
                        removeRow(selected, $table);
                    }
                }]
            }, {
                id: uid.TABLE,
                view: "datatable",
                resizeColumn: true,
                scroll: "y",
                select: true,
                columns: [{
                    id: "name",
                    header: "Название опроса",
                    fillspace: 3,
                    template: function(row) {
                        return "<a class='name'>" + row.name + "</a>";
                    }
                }, {
                    id: "name",
                    header: "Описание",
                    fillspace: 3,
                    template: function(row) {
                        return "<span class='description'>" + row.description + "</span>";
                    }
                }, {
                    id: "name",
                    header: "Автор",
                    fillspace: 3,
                    template: function(row) {
                        return "<span class='creator'>" + row.creator.firstname + " " + row.creator.lastname + "</span>";
                    }
                }, {
                    id: "date",
                    header: "Дата создания",
                    fillspace: 3,
                    template: function(row) {
                        var timeStr;
                        if (row.date) {
                            timeStr = time.dateToStr(row.date, "%j %B, " + webix.i18n.timeFormat);
                        }
                        else {
                            timeStr = ""
                        }
                        return "<span class='time'>" + timeStr + "</span>";
                    }
                }, {
                    id: "answersNumbers",
                    header: "Количество вопросов",
                    fillspace: 3,
                    template: function(row) {
                        return "<span class='answers'>" + row.answers.length + "</span>";
                    }
                }]
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

    return {
        $ui: ui,
        $windows: [addPopup],
        $oninit: function(view) {
            $$(uid.TABLE).clearAll();
            $$(uid.TABLE).load("/api/poll");
        }
    };
});