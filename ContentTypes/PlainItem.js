(function (win, doc, $, _, Backbone, root) {

	var PlainItem = Backbone.Model.extend({
		defaults: {
			color: "transparent",
			width: 0,
			height: 0
		}
	}),
	PlainItemView = Backbone.View.extend({
		initialize: function () {
			this.change(this.model);
			this.model.on("change", this.change, this);
		},
		change: function (m) {
			this.$el.width(m.get("width"));
			this.$el.height(m.get("height"));
			this.$el.css("background", m.get("color"));
		},
		exportHTML: function () {
			return this.$el.clone()[0];
		}
	})

	root.ContenttypeRegistry.define("Plain", PlainItem, PlainItemView, true);
})(window, document, jQuery, _, Backbone, window.ds);