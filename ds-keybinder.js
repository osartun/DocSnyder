(function(root, Backbone, _, $) {
	var $win = $(window);

	root.Keybinder = {
		on: function (shortcut, callback, preventDefault) {
			$win.on("keydown", shortcut, {
				"preventDefault": preventDefault,
				"shortcut": shortcut,
				"callback": _.isFunction(callback) ? callback : $.noop
			}, function(e) {
				if (e.data.preventDefault) {
					e.preventDefault();
				}
				e.data.callback(e, e.data.shortcut);
			});
		}
	};
})(this, Backbone, _, jQuery);