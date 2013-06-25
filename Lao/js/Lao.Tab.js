(function (win, doc, Backbone, _, $, Lao) {

	var Tab = Lao.extend("Component", {
		template: "<div><ul class=\"LaoTabList\"><!-- Lao:Appendpoint --></ul><div class=\"LaoTabContent\"><!-- Lao:Appendpoint --></div></div>",
		tabTitleHTML: _.template("<li class=\"LaoTabTitle\"><%= title %></li>"),
		className: "LaoTab",
		tabs: [],
		initialize: function () {
			if (this.collection) {
				var tabs = [];
				this.collection.each(function (model) {
					tabs.push(new Tab({
						"model": model
					}))
				}, this);
				this.collection
				.on("add remove")
			} else if (this.model) {
				this.tabTitle = $(this.tabTitleHTML(this.model.toJSON())).insertAfter(this.getAppendPoints().eq(0));
				this.model.on("change:title", function (model) {
					this.tabTitle.replaceWith(this.tabTitleHTML(model.toJSON()));
				}, this);
			}
		},
		setContent: function (content) {
			var appendPoint = this.getAppendPoints().eq(1);
			appendPoint.siblings().remove();
			if (content) appendPoint.after(content);
		}
	})

})(window, document, Backbone, _, $, Lao);