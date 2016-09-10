define("plugins/menu", function() {
	'use strict';
	
	function get_menu(scope) {
		if (scope.parent)
			return scope.parent.module.$menu || get_menu(scope.parent);
	}

	return {
		$onurlchange: function(ui, route, url, scope) {
			var menu = get_menu(scope);
			var $menu = typeof menu === 'function' ? menu.call(ui, ui, route, url) : menu;
			if (!$menu) return;
			var id = route ? route.page : null;
			if (!id) return;
			if ($menu.exists(id)) $menu.select(id);
		}
	};
	
});