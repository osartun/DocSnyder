(function (win, doc, $, root) {
	var Document = root.List.extend({
		model: root.Page
		defaults: root.Defaults.Document,
		initialize: function() {
			this.getSet("title width height".split(" "));
		}
	});
	root.Document = Document;
})(window, document, jQuery, docSnyder);