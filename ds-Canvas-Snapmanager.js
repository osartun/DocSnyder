(function (root, global, Backbone, _, $) {
	if (!root || !global || !Backbone || !_ || !$) return;

var guideList = root.guideList,
	itemList = root.document.getCurrentPage().get("itemList"),
	ScaleManager = root.ScaleManager;

var SnapManager = new (Backbone.Model.extend({
	defaults: {
		rangeX: 10,
		rangeY: 10,
		snapTo: {
			guides: true,
			itemsStart: false,
			itemsCenter: false,
			itemsEnd: false,
			page: true,
			pageEnd: true
		}
	},
	positionTypes: {
		guides: true,
		itemsStart: true,
		itemsCenter: true,
		itemsEnd: true,
		page: true,
		pageEnd: true
	},
	r_splitDirection: /^([ns]?)([ew]?)$/,
	toUpperCaseMap: {
		"x": "X",
		"y": "Y",
		"X": "X",
		"Y": "Y"
	},
	_getPositions: function (axis, type) {
		return this["_" + type + this.toUpperCaseMap[axis]];
	},
	_addPosition: function (axis, type, position, dsObjectId) {
		// type can be any of the positionTypes. Other types are ignored
		if (type in this.positionTypes) {
			this._getPositions(axis, type)[Math.round(position)|0] = dsObjectId;
		}
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
		// Returns an Array with all found snap positions in the interval between from and until

		var reversed = until < from,
		i = reversed ? until|0 : from|0,
		end = reversed ? from|0 : until|0,
		positions = this._getPositions(axis, type), posInRange = [];
		for (; i <= end; i++) {
			if (i in positions) posInRange.push(i);
		}
		return reversed ? posInRange.reverse() : posInRange;
	},
	_getFirstSnapPositionFromUntil: function (axis, type, from, until) {
		// Returns the first found snap position

		var positions = this._getPositions(axis, type), i;
		// turn from and until into integers
		from |= 0;
		until |= 0;

		if (from < until) {
			for (i = from; i <= until; i++) {
				if (i in positions) return i;
			}
		} else {
			for (i = from; i >= unil; i--) {
				if (i in positions) return i;
			}
		}
	},
	_getSnapPositionsInRange: function (axis, type, position, range) {
		return this._getSnapPositionsFromUntil(axis, type, position - range, position + range);
	},
	_getFirstSnapPositionInRange: function (axis, type, position, range) {
		return this._getFirstSnapPositionFromUntil(axis, type, position - range, position + range);
	},
	_detectSnapForCoord: function (axis, position, range) {
		var type, types = this.get("snapTo"), snapTo, res, diff, closestDiff = range;
		for (type in types) {
			if (types[type]) {
				if (type === "itemsStart") type = "items";
				snapTo = this._getFirstSnapPositionInRange(axis, type, position, range);
				if (snapTo !== undefined && (diff = Math.abs(snapTo - position)) < closestDiff) {
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
	_detectSnapForCoords: function (attrs, rangeX, rangeY, scaleRange) {
		if (!_.isNumber(rangeX)) {
			rangeX = this.get("rangeX");
		}
		if (!_.isNumber(rangeY)) {
			rangeY = this.get("rangeY");
		}
		if (scaleRange) {
			rangeX /= ScaleManager.get("scaleX");
			rangeY /= ScaleManager.get("scaleY");
		}
		var attr, axis, position, snapX, snapY, diffX, diffY,
		closestDiffX = rangeX, closestDiffY = rangeY,
		res = {snapX: undefined, snapY: undefined};
		for (attr in attrs) {
			axis = attr.substr(-1);
			position = attrs[attr];
			if (_.isNumber(position)) {
				if (axis === "X") {
					snapX = this._detectSnapForCoord(axis, position, rangeX);
					if (snapX && snapX.diff < closestDiffX) {
						snapX.adjustWhat = attr;
						snapX.axis = axis;
						res.snapX = snapX;
					}
				} else if (axis === "Y") {
					snapY = this._detectSnapForCoord(axis, position, rangeY);
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
	resizeRectangle: function (startX, startY, width, height, fixedDirection, range, scaleRange) {
		return this.snapRectangle(startX, startY, width, height, true, fixedDirection, range, scaleRange != false);
	},
	moveRectangle: function (startX, startY, width, height, range, scaleRange) {
		return this.snapRectangle(startX, startY, width, height, false, null, range, scaleRange != false);
	},
	snapRectangle: function (startX, startY, width, height, resize, fixedDirection, range, scaleRange) {
		// TODO: Remove SnapGuides of the item currently moved / resized!

		resize &= true; // if resize is undefined fall back to default false
		var coordsToCheck = {
			startX: startX,
			endX: startX + width,
			startY: startY,
			endY: startY + height,
			centerX: ~~(startX + width/2),
			centerY: ~~(startY + height/2)
		}, res;

		// fixedDirection is the handle that shouldn't be moved. We're turning it in
		// either null or a RegExp-Result with [1] for the vertical fixed direction
		// (if available) and [2] for the horizontal fixed direction
		fixedDirection = typeof fixedDirection === "string" ? this.r_splitDirection.exec(fixedDirection) : null;

		if (!resize) {
			coordsToCheck.centerX = ~~(startX + width/2);
			coordsToCheck.centerY = ~~(startY + height/2);
		} else if (fixedDirection) {
			switch (fixedDirection[1]) {
				case "n": delete coordsToCheck.startY; break;
				case "s": delete coordsToCheck.endY; break;
			}

			switch (fixedDirection[2]) {
				case "e": delete coordsToCheck.endX; break;
				case "w": delete coordsToCheck.startX; break;
			}
		}

		res = _.extend({
			"x": startX,
			"y": startY,
			"width": width,
			"height": height
		}, this._detectSnapForCoords(coordsToCheck, range, range, !!scaleRange));

		if (resize && fixedDirection) {
			if (res.snapX) {
				if (fixedDirection[2] === "w") {
					if (res.snapX.adjustWhat === "endX") {
						res.width = width + res.snapX.direction * res.snapX.diff;
					}
				} else if (fixedDirection[2] === "e") {
					if (res.snapX.adjustWhat === "startX") {
						res.x = res.snapX.snapTo;
						res.width = width - res.snapX.direction * res.snapX.diff;
					}
				}
			}
			if (res.snapY) {
				if (fixedDirection[1] === "n") {
					if (res.snapY.adjustWhat === "endY") {
						res.height = height + res.snapY.direction * res.snapY.diff;
					}
				} else if (fixedDirection[1] === "s") {
					if (res.snapY.adjustWhat === "startY") {
						res.y = res.snapY.snapTo;
						res.height = height - res.snapY.direction * res.snapY.diff;
					}
				}
			}
		} else {
			if (res.snapX) {
				switch (res.snapX.adjustWhat) {
					case "startX": res.x = res.snapX.snapTo; break;
					case "centerX": res.x = res.snapX.snapTo - width/2; break;
					case "endX": res.x = res.snapX.snapTo - width; break;
				}
			}
			if (res.snapY) {
				switch (res.snapY.adjustWhat) {
					case "startY": res.y = res.snapY.snapTo; break;
					case "centerY": res.y = res.snapY.snapTo - height/2; break;
					case "endY": res.y = res.snapY.snapTo - height; break;
				}
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

		root.demand(["document"], function () {
			var isSet = false, pageID = "ds-canvas-page";
			root.document.getCurrentPage().on("change", function (m, c) {
				if ("width" in m.changed || "height" in m.changed) {
					if (!isSet) {
						this._addPosition("x", "page", 0, pageID);
						this._addPosition("y", "page", 0, pageID);
						this._addPosition("x", "pageEnd", m.get("width"), pageID);
						this._addPosition("Y", "pageEnd", m.get("height"), pageID);
						isSet = true;
					} else {
						this._changePosition("x", "pageEnd", m.get("width"), pageID);
						this._changePosition("y", "pageEnd", m.get("height"), pageID);
					}
				}
			}, this)
		}, this);

		this.items.on("add", function (m) {
			var i = 0, l = itemAttr.length, attr, id = m.get("id");
			for (; i < l; i++) {
				attr = itemAttr[i];
				this._addPosition(attr.substr(-1), "items" + _.capitalize(attr).slice(0,-1), m[attr], id);
			}
		}, this);
		this.items.on("change", function (m) {
			if ("x" in m.changed || "y" in m.changed) {
				var i = 0, l = itemAttr.length, attr, id = m.get("id");
				for (; i < l; i++) {
					attr = itemAttr[i];
					this._changePosition(attr.substr(-1), "items" + _.capitalize(attr).slice(0,-1), m[attr], id);
				}
			}
		}, this);
		this.items.on("remove", function (m) {
			var i = 0, l = itemAttr.length, attr, id = m.get("id");
			for (; i < l; i++) {
				attr = itemAttr[i];
				this._removePosition(attr.substr(-1), "items" + _.capitalize(attr).slice(0,-1), id);
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