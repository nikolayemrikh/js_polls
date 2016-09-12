define("plugins/user", [
	"models/user"
], function(user) {
	'use strict';

	function router(path) {
		require([
			"app",
			"mobiledetect"
		], function(app, MobileDetect) {
			if (path) return app.show(path);
			var md = new MobileDetect(window.navigator.userAgent);
			if (md.mobile()) return app.show("mobile");
			var role = user.get('role') || {};
			switch (role) {
				case 1:
					app.show("main/student.room");
					break;
				case 3:
					app.show("main/admin.room");
					break;
				default:
					app.show("main/student.room");
					//app.show("login");
			}
		});
	}

	return {
		$onurl: function(url) {
			switch (url) {
				case 'login':
				case 'download':
					return true;
				default:
					/*if (!user.isAuth()) {
						user.fetch().then(function() {
							router(window.location.hash.slice(1));
						}).fail(function() {
							router("login");
						});
						return false;
					}*/
					if (url === 'home') {
						router();
						return false;
					}
			}
		}
	};
});
