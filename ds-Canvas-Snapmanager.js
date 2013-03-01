(function (root, global, Backbone, _, $) {
	if (!root || !global || !Backbone || !_ || !$) return;

var guideList = root.guideList,
	itemList = root.itemList,
	ScaleManager = root.ScaleManager;

var SnapManager = new (Backbone.Model.extend({
	initialize: function () {
		ScaleManager.on("change", function (m,c) {
			if (c && c.changes && (c.changes.scaleX || c.changes.scaleY)) {
				this.range.set("range", ~~Math.round( 10 / ((m.get("scaleX") + m.get("scaleY"))/2) ))
			}
		}, this);
	},
	defaults: {
		range: 10,
		snapTo: {
			guides: true,
			itemsStart: false,
			itemsCenter: false,
			itemsEnd: false,
			page: true,
			pageEnd: true
		}
	},
	_getPositions: function (axis, type) {
		return this["_" + type + axis.toUpperCase()];
	},
	_addPosition: function (axis, type, position, dsObjectId) {
		this._getPositions(axis, type)[position] = dsObjectId;
	},
	_removePosition: function (axis, type, dsObjectId) {
		var i, positions = this._getPositions(axis, type);
		for (i in positions) {
			if (positions[i] === dsObjectId) {
				return delete positions[i];
			}
		}
		return false;
	},
	_changePosition: function (axis, type, position, dsObjectId) {
		this._removePosition(axis, type, dsObjectId);
		this._addPosition(axis, type, position, dsObjectId);
	},
	_getSnapPositionsFromUntil: function (axis, type, from, until) {
		var i, positions = this._getPositions(axis, type), posInRange = [];
		for (i in positions) {
			if (i >= from && i <= until) posInRange.push(i);
		}
		return from < until ? posInRange : posInRange.reverse();
	},
	_getSnapPositionsInRange: function (axis, type, position, range) {
		return this._getSnapPositionsFromUntil(axis, type, position - range, position + range);
	},
	_detectSnapForCoord: function (axis, position, range) {
		var type, types = this.get("snapTo"), snapTo, res, diff, closestDiff = range;
		for (type in types) {
			if (types[type]) {
				if (type === "itemsStart") type = "items";
				snapTo = this._getSnapPositionsInRange(axis, type, position, range)[0];
				if (snapTo !== undefined && (snapTo = ~~snapTo) && (diff = Math.abs(snapTo - position)) < closestDiff) {
					closestDiff = diff;
					res = {
						"adjustTo": type !== "items" ? type : "itemsStart",
						"snapTo": snapTo,
						"dsObjectId": this._getPositions(axis, type)[snapTo],
						"diff": diff,
						"direction": snapTo > position ? 1 : -1
					};
				}
			}
		}
		return res;
	},
	_detectSnapForCoords: function (attrs, range) {
		if (range === undefined) range = this.get("range");
		var attr, axis, position, snapX, snapY, diffX, diffY, closestDiffX = closestDiffY = range,
		res = {snapX: undefined, snapY: undefined};
		for (attr in attrs) {
			axis = attr.substr(-1).toLowerCase();
			position = attrs[attr];
			if (_.isNumber(position)) {
				if (axis === "x") {
					snapX = this._detectSnapForCoord(axis, position, range);
					if (snapX && snapX.diff < closestDiffX) {
						snapX.adjustWhat = attr;
						snapX.axis = axis;
						res.snapX = snapX;
					}
				} else if (axis === "y") {
					snapY = this._detectSnapForCoord(axis, position, range);
					if (snapY && snapY.diff < closestDiffY) {
						snapY.adjustWhat = attr;
						snapY.axis = axis;
						res.snapY = snapY;
					}
				}
			}
		}
		return res;
	},
	snapRectangle: function (startX, startY, width, height, resize, range) {
		// TODO: Remove SnapGuides of the item currently moved / resized!

		resize &= true; // if resize is undefined fall back to default false
		var test = {
			startX: startX,
			endX: startX + width,
			startY: startY,
			endY: startY + height
		}, res, scaleX = ScaleManager.get("scaleX"), scaleY = ScaleManager.get("scaleY");

		if (!resize) {
			test.centerX = ~~(startX + width/2);
			test.centerY = ~(startY + height/2);
		}

		res = _.extend({
			"x": startX,
			"y": startY,
			"width": width,
			"height": height
		}, this._detectSnapForCoords(test, range));
		
		if (res.snapX) {
			res.x = res.snapX.snapTo;
			if (resize) {
				width -= res.snapX.diff * res.snapX.direction;
				res.width = width;
			}
			if (res.snapX.adjustWhat === "centerX") {
				res.x -= width/2;
			} else if (res.snapX.adjustWhat === "endX") {
				res.x -= width;
			}
		}
		if (res.snapY) {
			res.y = res.snapY.snapTo;
			if (resize) {
				height -= res.snapY.diff * res.snapY.direction;
				res.height = height;
			}
			if (res.snapY.adjustWhat === "centerY") {
				res.y -= height/2;
			} else if (res.snapY.adjustWhat === "endY") {
				res.y -= height;
			}
		}
		res.cssPosition = {
			"top": res.y,
			"left": res.x
		};
		res.cssDimension = {
			"width": res.width,
			"height": res.height
		};
		return res;
	},
	initialize: function (attr) {
		_.extend(this, {
			"guides": attr.guides,
			"items": attr.items,
			"_guidesX": {},
			"_guidesY": {},
			"_itemsX": {},
			"_itemsY": {},
			"_itemsCenterX": {},
			"_itemsCenterY": {},
			"_itemsEndX": {},
			"_itemsEndY": {},
			"_pageX": {},
			"_pageY": {},
			"_pageEndX": {},
			"_pageEndY": {}
		});

		var itemAttr = ["x", "y", "centerX", "centerY", "endX", "endY"];

		this.guides.on("add", function (m) {
			this._addPosition(m.get("axis"), "guides", m.get("position"), m.get("id"));
		}, this);
		this.guides.on("change:position", function (m) {
			this._changePosition(m.get("axis"), "guides", m.get("position"), m.get("id"));
		}, this);
		this.guides.on("remove", function (m) {
			this._removePosition(m.get("axis"), "guides", m.get("position"), m.get("id"));
		}, this);

		root.demand(["page"], function () {
			var isSet = false;
			root.page.on("change", function (m, c) {
				if (c && c.changes && (c.changes.width || c.changes.height)) {
					if (!isSet) {
						this._addPosition("x", "page", 0, "ds-canvas-page");
						this._addPosition("y", "page", 0, "ds-canvas-page");
						this._addPosition("x", "pageEnd", m.get("width"), "ds-canvas-page");
						this._addPosition("Y", "pageEnd", m.get("height"), "ds-canvas-page");
						isSet = true;
					} else {
						this._changePosition("x", "pageEnd", m.get("width"), "ds-canvas-page");
						this._changePosition("y", "pageEnd", m.get("height"), "ds-canvas-page");
					}
				}
			}, this)
		}, this);

		this.items.on("add", function (m) {
			var i, attr, id = m.get("id");
			for (i in itemAttr) {
				attr = itemAttr[i];
				this._addPosition(attr.substr(-1).toLowerCase(), "items" + _.capitalize(attr).slice(0,-1), m[attr], id);
			}
		}, this);
		this.items.on("change:position", function (m) {
			var i, attr, id = m.get("id");
			for (i in itemAttr) {
				attr = itemAttr[i];
				this._changePosition(attr.substr(-1).toLowerCase(), "items" + _.capitalize(attr).slice(0,-1), m[attr], id);
			}
		}, this);
		this.items.on("remove", function (m) {
			var i, attr, id = m.get("id");
			for (i in itemAttr) {
				attr = itemAttr[i];
				this._removePosition(attr.substr(-1).toLowerCase(), "items" + _.capitalize(attr).slice(0,-1), id);
			}
		}, this);
	}
}))({
	guides: guideList,
	items: itemList
});

root.supply({
	"SnapManager": SnapManager
})

})(ds, this, Backbone, _, jQuery);