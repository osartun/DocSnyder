/**
 * The Item-Prototype.
 */
(function (win, doc, $, root) {
	var Item = Backbone.Model.extend({
		defaults: root.Defaults.Item,
		initialize: function(attr) {
			this.set({
				"type": attr.type
			});
		}
	});
	root.Item = Item;
})(window, document, jQuery, docSnyder);