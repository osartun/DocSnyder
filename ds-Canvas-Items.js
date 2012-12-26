(function (root, global, Backbone, _, $) {
	if (!root || !global || !Backbone || !_ || !$) return;

var Item = root.Item,
	itemList = root.itemList,
	SnapManager, SelectManagerView;

root.demand(["SnapManager", "SelectManagerView"], function() {
	SnapManager = root.SnapManager,
	SelectManagerView = root.SelectManagerView;
});

var dsItemView = new (Backbone.View.extend({
	initialize: function() {
		this.collection.on("add", this._addItem, this);
		this.collection.on("remove", this._removeItem, this);
		this.collection.on("change", this._changeItem, this);

		this.collection.on("change", function (m, c) {
			(this.getItemById(m) || $()).css({
				top: m.y,
				left: m.x,
				width: m.width,
				height: m.height
			});
		}, this);

		this.meta = this.$(".ds-canvas-metalayer");
		this.content = this.$(".ds-canvas-contentlayer");

		this.cache = {};
		this._itemList = {};
	},
	getItemById: function (id) {
		return this._itemList[ typeof id === "string" ? id : (id instanceof Item ? id.get("id") : undefined)];
	},
	_addItem: function (item) {
		var itemEl = $("<div class='ds-canvas-item' id='" + item.get("id") + "'><img src='test.jpg' style='width:100%;height:100%' /></div>").css({
			width: item.width,
			height: item.height,
			left: item.x,
			top: item.y,
		}).appendTo(this.content);
		this._itemList[item.get("id")] = itemEl;
	},
	_removeItem: function (item) {
		this.getItemById(item).remove();
		delete this._itemList[item.get("id")];
	},
	_changeItem: function(item, c) {
		if (!c.changes.selected) {
			this.getItemById(item).css({
				width: item.width,
				height: item.height,
				left: item.x,
				top: item.y
			});
		}
	},
	move: function (e) {
		if(e.dsType === "item") {
			var targets = e.$target.add(SelectManagerView.getSelectionFrameById(e.dsObjectId)),
				item = e.dsObject;

			if (e.type === "dragstart") {
				this.positionInTarget = e.getPositionInTarget();
			}
			var x = e.pageX - this.positionInTarget.x,
				y = e.pageY - this.positionInTarget.y,
				snap;

			snap = SnapManager.snapRectangle(x, y, item.width, item.height);

			targets.css(snap.cssPosition);

			if (e.type === "dragend") {
				item.set({
					x: snap.x,
					y: snap.y
				});
			}
		}
	},
	resize: function (e) {
		if (e.dsType === "selectframe-handle") {
			var data = e.dsObject, item = data.dsObject, movingHandle = {
				x: e.pageX,
				y: e.pageY
			}, fixedHandle = {}, snapData,
			x, y, width, height,
			scaleX, scaleY, transformOrigin = "";

			// Correct movingHandle coordinates in case of single-axis transformation
			if (data.direction === "n" || data.direction === "s") {
				movingHandle.x = item.x + item.width;
			} else if (data.direction === "e" || data.direction === "w") {
				movingHandle.y = item.y + item.height;
			}

			if (e.type === "dragstart") {
				data.$itemEl.css("webkitTransformOrigin", "0 0");
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

			snapData = SnapManager.snapRectangle(x,y,width,height, true);

			scaleX = snapData.width / item.width;
			scaleY = snapData.height / item.height;

			e.$target.parent().css(_.extend({}, snapData.cssDimension, snapData.cssPosition));

			if (e.type !== "dragend") {
				data.$itemEl.css(_.extend({
					"webkitTransform": "rotate(" + item.rotation + "deg) scaleX(" + scaleX + ") scaleY(" + scaleY + ")",
				}, snapData.cssPosition));
			} else {
				data.$itemEl.css(_.extend({
					"webkitTransformOrigin": item.transformOrigin,
					"webkitTransform": item.transform
				}, snapData.cssPosition, snapData.cssDimension));
				data.dsObject.set(_.extend({
					x: snapData.x,
					y: snapData.y
				}, snapData.cssDimension));
			}
		}
	},
	events: {
		"dragstart": "move",
		"drag": "move",
		"dragend": "move",
		"dragstart .ds-canvas-selectframe-handle": "resize",
		"drag .ds-canvas-selectframe-handle": "resize",
		"dragend .ds-canvas-selectframe-handle": "resize"
	}
}))({
	collection: itemList,
	el: $(".ds-canvas")
});

root.supply({
	"ItemView": dsItemView
})
})(ds, this, Backbone, _, jQuery);