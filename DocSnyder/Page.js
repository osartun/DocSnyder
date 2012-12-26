(function (win, doc, $, root) {
	var Page = Backbone.Model.extend({
		defaults: _.clone(root.Defaults.Page),
		pageMaster: undefined,
		getItems: function() {
			return this.get("items");
		},
		getItem: function(index) {
			return this.get("items").at(index);
		},
		addItem: function() {
			return this.get("items").add.apply(arguments);
		},
		removeItem: function() {
			return this.get("items").remove.apply(arguments);
		},
		initialize: function() {
			this.set("items", new root.ItemCollection())
		}
	});
	root.Page = Page;
})(window, document, jQuery, docSnyder);