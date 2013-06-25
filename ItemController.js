(function (win, doc, $, _, Backbone, root) {

	var ItemController = Backbone.Model.extend({
		create: function (type, attributes) {
			var instance = this.createContentOnly(type, attributes), itemList, itemAttrs, item;
			if (instance) {
				itemList = root.document.getCurrentPage().get("itemList");
				itemAttrs = _.pick(attributes, "width", "height", "x", "y");
				item = new root.Item(_.extend(itemAttrs, {content: instance}));
				itemList.add(item);
			}
		},
		createContentOnly: function (type, attributes) {
			var registry = root.ContenttypeRegistry, Constructor;
			if (registry.isContenttypeAvailable(type)) {
				Constructor = registry.getContentPrototype(type);
				return new Constructor(_.omit(attributes, "x", "y"));
			}
		}
	});

	root.supply({"ItemController": new ItemController});
})(window, document, jQuery, _, Backbone, window.ds);