(function(root, Backbone, $, _) {
	UnitModel = Backbone.Model.extend({
		x: undefined,
		y: undefined,
		width: undefined,
		height: undefined,
		draggable: true,
		validate: function(attr) {
			if (isNaN(attr.x) || isNaN(attr.y)) {
				return "The coordinates x and y must be given and valid numbers";
			}
			if (typeof draggable !== "boolean") {
				return "The draggable attribute must be set and of type boolean";
			}
		}
	});

	function
	return (root.LayoutUnit = LayoutUnit)
})(docsnyder, Backbone, jQuery, _);