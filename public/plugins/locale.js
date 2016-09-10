/* global webix */

define("plugins/locale", [
	"polyglot"
], function(Polyglot) {
	'use strict';

	var defaultLang = "ru";
	var key = "language";

	function get_lang() {
		return webix.storage.local.get(key);
	}

	function set_lang(lang) {
		if (lang != get_lang()) {
			webix.storage.local.put(key, lang);
			document.location.reload();
		}
	}

	function create_locale(lang) {
		define("locale", [
			"locales/" + lang
		], function(l10n) {
			var poly = new Polyglot({
				phrases: l10n
			});
			switch (lang) {
				case 'ru':
					poly.locale('ru');
					webix.Date.startOnMonday = true;
					webix.i18n.locales["ru-RU"] = {
						groupDelimiter: " ",
						groupSize: 3,
						decimalDelimiter: ",",
						decimalSize: 2,

						dateFormat: "%d.%m.%Y",
						timeFormat: "%H:%i",
						longDateFormat: "%d %F %Y",
						fullDateFormat: "%d.%m.%Y %H:%i",

						price: "{obj} руб.",
						priceSettings: null, //use number defaults

						fileSize: ["Б", "КБ", "МБ", "ГБ", "ТБ", "ПБ", "ЭБ"],

						calendar: {
							monthBeautiful: ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"],
							monthFull: ["Январь", "Февраль", "Март", "Апрель", "Maй", "Июнь", "Июль", "Август", "Сентябрь", "Oктябрь", "Ноябрь", "Декабрь"],
							monthShort: ["Янв", "Фев", "Maр", "Aпр", "Maй", "Июн", "Июл", "Aвг", "Сен", "Окт", "Ноя", "Дек"],
							dayFull: ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"],
							dayShort: ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
							hours: "Часы",
							minutes: "Минуты",
							done: "Гoтовo",
							clear: "Очистить",
							today: "Сегодня"
						},

						controls: {
							select: "Выбрать"
						},
						dataExport: {
							page: "Страница",
							of: "из"
						}
					};
					webix.i18n.setLocale('ru-RU');
					break;
				case 'en':
					poly.locale('en');
					webix.Date.startOnMonday = false;
					webix.i18n.locales["en-US"] = {
						groupDelimiter: ",",
						groupSize: 3,
						decimalDelimiter: ".",
						decimalSize: 2,

						dateFormat: "%m/%d/%Y",
						timeFormat: "%h:%i %A",
						longDateFormat: "%d %F %Y",
						fullDateFormat: "%m/%d/%Y %h:%i %A",

						price: "${obj}",
						priceSettings: {
							groupDelimiter: ",",
							groupSize: 3,
							decimalDelimiter: ".",
							decimalSize: 2
						},
						fileSize: ["b", "Kb", "Mb", "Gb", "Tb", "Pb", "Eb"],

						calendar: {
							monthBeautiful: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
							monthFull: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
							monthShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
							dayFull: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
							dayShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
							hours: "Hours",
							minutes: "Minutes",
							done: "Done",
							clear: "Clear",
							today: "Today"
						},

						controls: {
							select: "Select"
						},
						dataExport: {
							page: "Page",
							of: "of"
						}
					};
					webix.i18n.setLocale('en-US');
					break;
			}
			// поддержка опции %B для отображения склоняемого названия месяцев
			var dateToStr = webix.Date.dateToStr;
			webix.Date.dateToStr = function(format, utc) {
				var formatter = dateToStr(format, utc);
				return function(date) {
					var str = formatter(date);
					if (/%B/g.test(str) && webix.i18n.calendar.monthBeautiful) {
						var monthNames = [""].concat(webix.i18n.calendar.monthBeautiful);
						var monthNumber = webix.Date.dateToStr("%n");
						return str.replace(/%B/g, monthNames[monthNumber(date)]);
					}
					return str;
				};
			};
			webix.i18n.parseFormat = webix.i18n.dateFormat;
			webix.i18n.setLocale();
			return {
				getLang: get_lang,
				setLang: set_lang,
				t: webix.bind(poly.t, poly)
			};
		});
	}

	return {
		$oninit: function(app, config) {
			var lang = get_lang() || config.lang || defaultLang;
			set_lang(lang);
			create_locale(lang);
		}
	};
});