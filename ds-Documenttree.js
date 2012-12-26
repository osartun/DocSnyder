(function (root, global, Backbone, _, $) {
	if (!root || !global || !Backbone || !_ || !$) return;

/* Items */
var Item = Backbone.Model.extend({
		defaults: {
			x: 0,
			y: 0,
			width: 0,
			height: 0,
			rotation: 0,
			scaleX: 1,
			scaleY: 1,
			transformOrigin: "50% 50%"
		},
		validate: function (a) {
			if (!_.areNumbers(a.width, a.height, a.x, a.y, a.rotation)) {
				return "Wrong type: The values 'width', 'height', 'x', 'y' and 'rotation' must be numbers.";
			}
			if (typeof a.selected !== "boolean") {
				return "Wrong type: The value 'selected' must be of type Boolean.";
			}
		},
		isAreaInItem: function (x,y, width, height, fullyContained) {
			var endX = x + width, endY = y + height,
				s = { // smaller
					// These coordinates are left of or over the top of the item
					x: x <= this.x,
					y: y <= this.y,
					endX: endX <= this.x,
					endY: endY <= this.y
				},
				l = { // larger
					// These coordinates are right of or below the bottom of the item
					x: x >= this.endX,
					y: y >= this.endY,
					endX: endX >= this.endX,
					endY: endY >= this.endY
				};
			return fullyContained ?
				s.x && l.endX && s.y && l.endY :
				!(s.x && s.endX || l.x && l.endX || s.y && s.endY || l.y && l.endY); // We detect if the area is outside the item and negate it afterwards
		},
		isPointInItem: function (x,y) {
			return this.isAreaInItem(x,y,0,0,false);
		},
		_resetReadOnlyData: function(model, changes) {
			var x = this.get("x"),
				y = this.get("y"),
				width = this.get("width"),
				height = this.get("height"),
				transform = "rotate(" + this.get("rotation") + "deg) scaleX(" + this.get("scaleX") + ") scaleY(" + this.get("scaleY") + ")";
			_.extend(this, this.attributes, {
				endX: x + width,
				endY: y + height,
				centerX: x + (width/2),
				centerY: y + (height/2),
				transform: transform
			});
		},
		initialize: function (a) {
			var x = a.x || 0, y = a.y || 0, width = a.width || 0, height = a.height || 0, rotation = a.rotation || 0, selected = a.selected || false, data;
			endX = x + width, endY = y + height, centerX = x + (width / 2), centerY = y + (height / 2);
			data = {
				width: width,
				height: height,
				x: x,
				y: y,
				rotation: a.rotation || 0
			};
			this.set(_.extend({}, data, {
				selected: a.selected || false,
				id: _.uniqueId("ds-canvas-item-")
			}));
			this._resetReadOnlyData(this, data);
			this.on("change", this._resetReadOnlyData, this);
		}
}),
ItemList = Backbone.Collection.extend({
	model: Item,
	initialize: function() {
		UndoManager.register(this);
	},
	getItemById: function (itemId) {
		return this.where({id: itemId})[0];
	}
}),
itemList = new ItemList();

var Page = Backbone.Model.extend({
	initialize: function (attr) {
		this.set({
			"scale": 1
		})
		this.itemList = attr.itemList;
	},
	getItemsOfArea: function (x,y, width, height, fullyContained) {
		if (fullyContained === undefined) fullyContained = true;
		return _.filter(this.itemList.models, function (item) {
			return item.isAreaInItem(x,y,width,height,fullyContained);
		});
	},
	getItemsOfPoint: function (x,y) {
		return _.filter(this.itemList.models, function (item) {
			return item.isPointInItem(x,y);
		})
	},
	getItemOfPoint: function (x,y) {
		return this.getItemsOfPoint(x,y).pop();
	}
});

var page = new Page({
	itemList: itemList
});

root.supply({
	"Item": Item,
	"page": page,
	"itemList": itemList
})

})(ds, this, Backbone, _, jQuery);