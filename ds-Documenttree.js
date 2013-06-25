(function (root, global, Backbone, _, $) {
	if (!root || !global || !Backbone || !_ || !$) return;

var getNumber = function (prefix) {
	var curPage = root.document.getCurrentPage(), highest;
	if (!curPage) {
		// Not even the page is initialized. We're at the very beginning.
		return 0;
	} else {
		highest = curPage.get("itemList").max(function (item) {return item.get("nr")}),
		highestNumber = highest === -Infinity ? 0 : highest.get("nr");
		return highestNumber + 1;
	}
}

/* Items */
var Item = Backbone.Model.extend({
		defaults: function () {
			return {
				x: 0,
				y: 0,
				width: 0,
				height: 0,
				rotation: 0,
				scaleX: 1,
				scaleY: 1,
				transformOrigin: "50% 50%",
				visible: true,
				nr: getNumber(),
				content: null
			}
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
				visible = this.get("visible"),
				transform = "rotate(" + this.get("rotation") + "deg) scaleX(" + this.get("scaleX") + ") scaleY(" + this.get("scaleY") + ")";
			_.extend(this, this.attributes, {
				endX: x + width,
				endY: y + height,
				centerX: x + (width/2),
				centerY: y + (height/2),
				transform: transform,
				visibility: visible ? "visible" : "hidden"
			});
			this.get("content").getModel().set({
				"width": width,
				"height": height
			})
		},
		setContent: function () {
			var contentData = this.get("content"), content;
			if ($.isPlainObject(contentData)) {
				content = root.ItemController.createContentOnly(contentData.type, _.omit(contentData, "type"));
				this.set("content", content);
			}
			return this;
		},
		initialize: function (a) {
			this.setContent().on("change:content", this.setContent, this);
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
			this.get("content").getModel().on("change", function (m, v, o) {
				this.trigger("change", this, m, o);
			}, this);
		}
}),
ItemList = Backbone.Collection.extend({
	model: Item,
	getItemById: function (itemId) {
		return this.where({id: itemId})[0];
	}
});

var Page = Backbone.Model.extend({
	initialize: function (attr) {
		if (!attr || !(attr.itemList instanceof ItemList)) {
			this.set("itemList", new ItemList(attr ? attr.itemList : {}));
		}
	},
	getItemsOfArea: function (x,y, width, height, fullyContained) {
		if (fullyContained === undefined) fullyContained = true;
		return this.get("itemList").filter(function (item) {
			return item.isAreaInItem(x,y,width,height,fullyContained);
		});
	},
	getItemsOfPoint: function (x,y) {
		return this.get("itemList").filter(function (item) {
			return item.isPointInItem(x,y);
		})
	},
	getItemOfPoint: function (x,y) {
		return this.getItemsOfPoint(x,y).pop();
	}
});

var PageList = Backbone.Collection.extend({
	model: Page
})

var Document = Backbone.Model.extend({
	defaults: {
		currentPage: 0
	},
	initialize: function (attr) {
		if (!attr || !(attr.pageList instanceof PageList)) {
			this.set("pageList", new PageList(attr ? attr.pageList : [{}]));
		}
		this.get("pageList").on("change", function (model, options) {
			this.trigger("change", model, options);
		}, this);
	},
	getCurrentPage: function () {
		return this.get("pageList").at(this.get("currentPage"));
	},
	goToPage: function (index) {
		if (_.isNumber(index)) {
			index = Math.max(index, 0);
			index = Math.min(index, this.get("pageList").length - 1);

			this.set("currentPage", index);
		}
	},
	nextPage: function () {
		this.goToPage(this.get("currentPage") + 1);
	},
	previousPage: function () {
		this.goToPage(this.get("currentPage") - 1);
	},
	goToFirstPage: function () {
		this.goToPage(0)
	},
	goToLastPage: function () {
		this.goToPage(this.get("pageList").length - 1)
	}
})

root.supply({
	"Item": Item,
	"Page": Page,
	"PageList": PageList,
	"Document": Document,
	"document": new Document
})

})(ds, this, Backbone, _, jQuery);