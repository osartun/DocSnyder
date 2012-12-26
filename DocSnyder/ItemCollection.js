/**
 * Contains all the objects of a page.
 */
(function (win, doc, $, root) {
	var ItemCollection = Backbone.Collection.extend({
		model: root.Item
	});
	root.ItemCollection = ItemCollection;
})(window, document, jQuery, docSnyder);