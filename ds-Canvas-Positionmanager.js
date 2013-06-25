(function (root, global, Backbone, _, $, undefined) {
	var ScrollManager = root.ScrollManager,
		ScaleManager = root.ScaleManager,
		pageOffset = {top: 0, left: 0},
		Canvas = root.Canvas,
		containerOffset = $(".ds-canvas").offset();

	//root.demand("Sizemanager")
	root.SizeManager.on("change", function () {
		containerOffset = $(".ds-canvas").offset();
	})

	Canvas.on("setup", function (e) {
		pageOffset = {
			top: e.pageStartY,
			left: e.pageStartX
		}
	}, this);

	var PositionManager = {
		cursorToPagecoords: function (x,y) {
			var scaleX = ScaleManager.get("scaleX"),
				scaleY = ScaleManager.get("scaleY"),
				scrollLeft = ScrollManager.get("scrollLeft"),
				scrollTop = ScrollManager.get("scrollTop");
			if (typeof x !== "number") {
				x = parseFloat(x);
			}
			if (typeof y !== "number") {
				y = parseFloat(y);
			}
			
			x -= containerOffset.left || 0,
			y -= containerOffset.top || 0;

			if (ScrollManager) {
				x += scrollLeft;
				y += scrollTop;
			}
			if (ScaleManager) {
				x /= scaleX;
				y /= scaleY;
			}
			x -= pageOffset.left;
			y -= pageOffset.top;

			return {
				pageX: x,
				pageY: y
			}
		}
	};

	root.supply({
		"PositionManager": PositionManager
	})
})(ds, this, Backbone, _, jQuery);