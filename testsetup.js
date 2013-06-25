(function(win, undefined) {
	// "global" variables within this closure scope
	var $ = jQuery,
		doc = document,
		root = win.ds || {},
		dsCanvas = root.canvas || {};

	var tmp = $(".ds-canvas-container").detach();

	var scaffold = Lao.create("Scaffold", {
		"vertical": false,
		"children": {
			"topbar": {
				"height": 70
			},
			"toolbar": {
				"height": 30
			},
			"middlebar": {
				"children": {
					"left": {
						"className": "toollist",
						"width": 150
					},
					"center": {
						"className": "canvasWrapper"
					}
				}
			},
			"bottombar": {
				"height": 25
			}
		}
	});

	scaffold.appendTo(doc.body);

	scaffold.getBooth("toolbar").append(ds.ToolbarManager.activate().el);

	scaffold.getBooth("center").append(tmp);


	ds.document.getCurrentPage().set({
		width: 300,
		height: 300
	})
	ds.guideList.add({axis: "x", position: 300});
	ds.guideList.add({axis: "y", position: 200});
	ds.guideList.add({axis: "x", position: 100});
	ds.guideList.add({axis: "y", position: 300});

	ds.ItemController.create("Text", {
		x: 0,
		y: 0,
		width: 100,
		height: 200,
		content: "<p>Hallo Welt!</p>"
	})
	ds.ItemController.create("Image", {
		x: 100,
		y: 200,
		width: 200,
		height: 100,
		url: "test.jpg"
	})

	var layer = Lao.extend("ListItem", {
		template: "<li><div class=\"ListItem-Cell listitem-visibility listitem-is-<%= !visible ? \"in\":\"\" %>visible\"></div><div class=\"ListItem-Cell listitem-name\">Ebene <%= nr %></div></li>",
		className: "Layer",
		initialize: function () {
			if (this.model) {
				this.model.on("change:visible", this.changeVisible, this);
			}
		},
		changeVisible: function (m) {
			this.$(".listitem-visibility")
			.toggleClass("listitem-is-visible", m.get("visible"))
			.toggleClass("listitem-is-invisible", !m.get("visible"))
		},
		toggleVisibility: function (e) {
			e.stopPropagation();
			this.model.set("visible", !this.model.get("visible"));
		},
		events: {
			"click .listitem-visibility": "toggleVisibility"
		}
	}),
	Layers = Lao.extend("SelectableList", {
		className: "Layers",
		listItem: layer,
		initialize: function () {
			// We have two selectmanagers triggering each others select and unselect-methods
			// To prevent potential recursions we use a flag that indicates a current select-cycle
			var busy = false;

			ds.SelectManager.on("select unselect", function (e) {
				busy = true;
				var index = ds.document.getCurrentPage().get("itemList").indexOf(e.dsObject);
				this.selectManager[e.type](index);
				busy = false;
			}, this)

			this
			.on("add remove reset", function (m) {
				if (!busy) {
					var ids = _.pluck(this.selectManager.models, "id"),
					items = _.map(ids, function (id) {
						return ds.document.getCurrentPage().get("itemList").at(id);
					}, this);
					ds.SelectManager.selectOnly(items);
				}
			}, this)
		}
	});

	Lao.define({
		"fooLayer": layer,
		"fooLayers": Layers
	})
	var layers = Lao.create("fooLayers", {
		collection: ds.document.getCurrentPage().get("itemList")
	});

	scaffold.getBooth("left").append(layers);

	ds.UndoManager.register(ds.guideList, ds.document.get("pageList"), ds.document.getCurrentPage().get("itemList"));
	ds.UndoManager.startTracking();

	var zoomSteps = _.map([0.2, 0.5, 1, 1.5, 2, 3, 4, 5, 6, 7, 8], function (val) {
		return [(100 * val) + "%", val];
	}), zoomIndicator = new ds.ZoomIndicator({
		model: ds.ScaleManager,
		steps: zoomSteps
	})
	scaffold.getBooth("bottombar").append(zoomIndicator.el);

	$.Shortcut.on({
		"meta+H": function () {
			ds.ScaleManager.zoomIn()
		},
		"meta+V": function () {
			ds.ScaleManager.zoomOut()
		},
		"meta+0": function () {
			ds.ScaleManager.setScale(1)
		}
	});
})(ds, this);