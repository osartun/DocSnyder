(function(win, undefined) {
	// "global" variables within this closure scope
	var $ = win.jQuery,
		_ = win._,
		Backbone = win.Backbone,
		root = win.ds || {},
		dsCanvas = root.canvas || {};

	ds.page.set({
		width: 300,
		height: 300
	})
	ds.guideList.add({axis: "x", position: 300});
	ds.guideList.add({axis: "y", position: 200});
	ds.guideList.add({axis: "x", position: 100});
	ds.guideList.add({axis: "y", position: 300});

	ds.itemList.add({
		width: 100,
		height: 150,
		x: 0,
		y: 0
	});
	ds.itemList.add({
		width: 200,
		height:100,
		x: 100,
		y: 200
	});
})(ds, this);