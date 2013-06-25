(function (win, doc, $, _, Backbone, root) {

	var TextItem = Backbone.Model.extend({
		defaults: {
			content: "",
			width: 0,
			height: 0
		}
	}),
	TextItemView = Backbone.View.extend({
		initialize: function () {
			this.el.contentEditable = "true";
			this.setSize(this.model);
			this.setContent(this.model);

			this.model
			.on("change:content", this.setContent, this)
			.on("change", this.setSize, this);
		},
		setContent: function (m) {
			this.$el.text(m.get("content"));
		},
		setSize: function (m) {
			var changed = m.changedAttributes();
			if (changed.width || changed.height || _.isEmpty(changed)) {
				this.$el.innerWidth(m.get("width")).innerHeight(m.get("height"));
			}
		},
		exportHTML: function () {
			return $("<p/>").text(this.$el.val())[0];
		}
	})

	root.ContenttypeRegistry.define("Text", TextItem, TextItemView, true);
})(window, document, jQuery, _, Backbone, window.ds);