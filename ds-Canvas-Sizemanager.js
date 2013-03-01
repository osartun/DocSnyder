(function (root, global, Backbone, _, $, undefined) {
	var SizeManager = new (Backbone.Model);

	new (Backbone.View.extend({
		initialize: function () {
			this.fetchSize = _.bind(this.fetchSize, this);
			this.fetchSize();

			$(window).resize(this.fetchSize);

			window.setInterval(this.fetchSize, 300);
		},
		fetchSize: function() {
			SizeManager.set({
				"width": this.$el.width(),
				"height": this.$el.height()
			});
		},
		events: {
			"resize": "fetchSize"
		}
	}))({
		el: $(".ds-canvas"),
		model: SizeManager
	});

	root.supply({
		"SizeManager": SizeManager
	})
})(ds, this, Backbone, _, jQuery);