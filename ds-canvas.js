(function(win, undefined) {
	// "global" variables within this closure scope
	var $ = win.jQuery,
		_ = win._,
		Backbone = win.Backbone,
		root = win.ds || {},
		dsCanvas = root.canvas || {};
	ds.guideList.add({axis: "x", position: 300});
	ds.guideList.add({axis: "y", position: 200});

	ds.itemList.add({
		width: 100,
		height: 150,
		x: 300,
		y: 400
	});
	ds.itemList.add({
		width: 200,
		height:100,
		x: 350,
		y:350
	})
})(ds, this);