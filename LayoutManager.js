(function (win, doc, Backbone, _, $, undefined) {
	var LayoutProto = Backbone.Model.extend({
		activate: function (name) {
			if (name && this.active !== name && this.get(name)) {
				var previous = this.active;
				this.active = name;
				this.trigger("layoutChanged", this.get(name), {
					previous: this.get(previous)
				});
			}
		}
	}),
	LayoutManager = new LayoutProto;

	new (Backbone.View.extend({
		initialize: function () {
			LayoutManager.on("change:container", function (m,container) {
				this.container = $(container);
			}, this);

			LayoutManager.on("layoutChanged", this.setLayout, this);
		},
		setLayout: function (layout, prevLayout) {
			layout
		}
	}))({
		model: new 
	})
})(window, window.document, window.Backbone, window._, window.jQuery)