(function (win, doc, $, _, Backbone, root) {

	var ImageItem = Backbone.Model.extend({
		defaults: {
			url: "",
			width: 0,
			height: 0,
			uistate: "default"
		}
	}),
	ImageItemView = Backbone.View.extend({
		tagName: "img",
		initialize: function () {
			this.setSize(this.model.get("width"), this.model.get("height"));
			this.setURL(this.model.get("url"));
			this.model.on("change", this.change, this);
		},
		setURL: function (url) {
			if (url) {
				this.el.src = url;
			}
		},
		setSize: function (width, height) {
			if (this.model.get("uistate") === "resize") {
				// faster:
				if (this.$el.css("transformOrigin") !== "0 0") {
					this.$el.css("transformOrigin", "0 0");
				}
				this.$el.css("transform", "scaleX(" + width / this.width + ") scaleY(" + height / this.height + ")");
			} else {
				this.width = width;
				this.height = height;
				this.$el.css({
					"transformOrigin": "",
					"transform": ""
				}).width(width).height(height);
			}
		},
		change: function (m) {
			var changed = m.changedAttributes();
			if (changed) {
				if (changed.src) {
					this.setURL(changed.src);
				}
				if (changed.width || changed.height || changed.uistate) {
					this.setSize(m.get("width"), m.get("height"));
				}
			}
		},
		exportHTML: function () {
			return this.$el.clone()[0];
		}
	})

	root.ContenttypeRegistry.define("Image", ImageItem, ImageItemView, true);
})(window, document, jQuery, _, Backbone, window.ds);