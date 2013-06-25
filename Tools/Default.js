(function (win, doc, $, _, Backbone, root) {

var SnapManager = root.SnapManager,
shortcuts = {
		"meta + Z": function () {
			root.UndoManager.undo()
		},
		"meta + shift + Z": function () {
			root.UndoManager.redo()
		},
		"meta + A": function (e) {
			e.preventDefault();
			root.document.getCurrentPage().get("itemList").each(function(item, i) {
				root.SelectManager.select(item)
			})
		},
		"BACK_SPACE": function (e) {
			e.preventDefault();
			_.each(root.SelectManager.getSelectedItems(), function (item) {
				root.document.getCurrentPage().get("itemList").remove(item);
			})
		}
	};

_.each(["LEFT", "UP", "RIGHT", "DOWN"], function (key) {
	var direction = key === "UP" || key === "LEFT" ? -1 : 1,
		attribute = key === "UP" || key === "DOWN" ? "y" : "x";
	shortcuts[key] = shortcuts["shift + " + key] = function (e) {
		var selected = root.SelectManager.getSelectedItems(),
			current, offset = e.shiftKey ? 10 : 1;
		_.each(selected, function (item) {
			current = item.get(attribute);
			item.set(attribute, current + direction * offset);
		}, this);
		e.preventDefault();
	};
}, this);

var DefaultTool = root.Tool.extend({
	initialize: function () {
		this.cache = {};
	},
	inverseDirection: {
		"n": "s",
		"ne": "sw",
		"e": "w",
		"se": "nw",
		"s": "n",
		"sw": "ne",
		"w": "e",
		"nw": "se"
	},
	move: function (e) {
		if(e.dsType === "selectframe") {
			var data = e.dsObject,
				targets = e.$target.add(data.itemEl),
				item = data.dsObject;

			if (e.type === "dragstart") {
				this.positionInTarget = e.getPositionInTarget();
				data.dsObject.get("content").getModel().set("uistate", "drag");
			}
			var x = e.pageX - this.positionInTarget.x,
				y = e.pageY - this.positionInTarget.y,
				snap;

			snap = SnapManager.moveRectangle(x, y, item.width, item.height);


			targets.css(snap.cssPosition);

			if (e.type === "dragend") {
				item.set({
					x: snap.x,
					y: snap.y
				});
				data.dsObject.get("content").getModel().set("uistate", "default");
			}
		}
	},
	resize: function (e) {
		if (e.dsType === "selectframe-handle") {
			var data = e.dsObject, item = data.dsObject, movingHandle = {
				x: e.pageX,
				y: e.pageY
			}, fixedHandle = {}, fixedDirection = this.inverseDirection[data.direction],
			snapData, x, y, width, height,
			scaleX, scaleY, end, transformOrigin = "";

			// Correct movingHandle coordinates in case of single-axis transformation
			if (data.direction === "n" || data.direction === "s") {
				movingHandle.x = item.x + item.width;
			} else if (data.direction === "e" || data.direction === "w") {
				movingHandle.y = item.y + item.height;
			}

			if (e.type === "dragstart") {
				data.$itemEl.css("transformOrigin", "0 0");
				// x-Axis
				if (data.direction === "n" || data.direction === "s" || data.direction.indexOf("e") > -1) {
					fixedHandle.x = item.x;
					transformOrigin = "0 ";
				} else if (data.direction.indexOf("w") > -1) {
					fixedHandle.x = item.endX;
					transformOrigin = "100% ";
				}

				// y-Axis
				if (data.direction.indexOf("n") > -1) {
					fixedHandle.y = item.endY;
					transformOrigin += "100%";
				} else if (data.direction === "w" || data.direction === "e" || data.direction.indexOf("s") > -1) {
					fixedHandle.y = item.y;
					transformOrigin += "0";
				}
				this.cache.fixedHandle = fixedHandle;
				this.cache.transformOrigin = transformOrigin;
			} else {
				fixedHandle = this.cache.fixedHandle;
				transformOrigin = this.cache.transformOrigin;
			}

			width = Math.abs(movingHandle.x - fixedHandle.x);
			height = Math.abs(movingHandle.y - fixedHandle.y);

			x = Math.min(movingHandle.x, fixedHandle.x);
			y = Math.min(movingHandle.y, fixedHandle.y);

			snapData = SnapManager.resizeRectangle(x,y,width,height, fixedDirection);

			scaleX = snapData.width / item.width;
			scaleY = snapData.height / item.height;

			if (e.shiftKey) {
				// Shiftkey is pressed. The user wants to scale proportionally
				scaleX = scaleY = scaleX < scaleY ? scaleX : scaleY;

				end = snapData.x + snapData.width;
				snapData.width = item.width * scaleX;
				if (fixedDirection.indexOf("e") > -1) {
					snapData.x = end - snapData.width;
				}

				end = snapData.y + snapData.height;
				snapData.height = item.height * scaleY;
				if (fixedDirection.indexOf("s") > -1) {
					snapData.y = end - snapData.height;
				}

				snapData.cssPosition = {
					top: snapData.y,
					left: snapData.x
				};
				snapData.cssDimension = {
					width: snapData.width,
					height: snapData.height
				}
			}

			e.$target.parent().css(_.extend({}, snapData.cssDimension, snapData.cssPosition));
			data.dsObject.get("content").getModel().set("uistate", e.type !== "dragend"? "resize" : "default");

			data.dsObject.set(_.extend({
				x: snapData.x,
				y: snapData.y
			}, snapData.cssDimension));
		}
	},
	events: {
		"dragstart": "move",
		"drag": "move",
		"dragend": "move",
		"dragstart .ds-canvas-selectframe-handle": "resize",
		"drag .ds-canvas-selectframe-handle": "resize",
		"dragend .ds-canvas-selectframe-handle": "resize",
		"doubleclick": "edit"
	},
	cursor: "default",
	shortcuts: shortcuts
})

root.ToolManager.define("Default", new DefaultTool({
	el: $(".ds-canvas")
})).setDefaultTool("Default").setTool("Default");

})(window, document, jQuery, _, Backbone, window.ds);