(function (root, global, Backbone, _, $) {
	if (!root || !global || !Backbone || !_ || !$) return;

var Item = root.Item,
	Page = root.Page,
	itemList = root.itemList;

var SelectManager = new (Backbone.Model.extend({
	initialize: function () {
		this.selectedItems = {};
		this.selectedPages = {};
	},
	_isItem: function (obj) {
		return obj instanceof Item;
	},
	_isPage: function (obj) {
		return obj instanceof Page;
	},
	isSelected: function (obj) {
		return typeof obj.get === "function" && (obj.get("id") in (this._isItem(obj) ? this.selectedItems : this.selectedPages));
	},
	select: function (obj) {
		if (_.isArray(obj)) {
			return _.each(obj, this.select, this);
		}
		var isItem = this._isItem(obj);
		if (!this.isSelected(obj) && (isItem || this._isPage(obj))) {
			(isItem ? this.selectedItems : this.selectedPages)[obj.get("id")] = obj;
			this.trigger("select", {
				type: "select",
				dsObjectType: isItem ? "item" : "page",
				dsObjectId: obj.get("id"),
				dsObject: obj
			});
		}
	},
	unselect: function (obj) {
		if (_.isArray(obj)) {
			return _.each(obj, this.unselect, this);
		}
		var isItem = this._isItem(obj);
		if (this.isSelected(obj) && (isItem || this._isPage(obj))) {
			delete (isItem ? this.selectedItems : this.selectedPages)[obj.get("id")];
			this.trigger("unselect", {
				type: "unselect",
				dsType: isItem ? "item" : "page",
				dsObjectId: obj.get("id"),
				dsObject: obj
			})
		}
	},
	toggleSelect: function (obj, stateVal) {
		if (_.isArray(obj)) {
			return _.each(obj, this.toggleSelect, this);
		}
		var isItem = this._isItem(obj);
		if (typeof stateVal !== "boolean") {
			stateVal = !this.isSelected(obj);
		}
		if (isItem || this._isPage(obj)) {
			// is valid
			this[stateVal ? "select" : "unselect"](obj);
		}
	},
	selectOnly: function (obj) {
		var objects = _( _.isArray(obj) ? obj : [obj] );
		this.get("itemList").each(function(item) {
			this.toggleSelect(item, objects.contains(item));
		}, this);
	},
	unselectAll: function () {
		this.unselect(_.values(this.selectedItems));
	}
}))({
	"itemList": itemList
});



var SelectManagerView = new (Backbone.View.extend({
	initialize: function () {
		this.collection.on("add", this._addSelectionFrame, this);
		this.collection.on("change", this._changeSelectionFrame, this);
		this.collection.on("remove", this._removeSelectionFrame, this);

		this.meta = this.$(".ds-canvas-metalayer");
		this.content = this.$(".ds-canvas-contentlayer");

		this.selectionFrames = {};

		var handles = _.map("nw n ne e se s sw w".split(" "), function (dir) {
			return "<div class='ds-canvas-selectframe-handle ds-canvas-selectframe-handle-" + dir + "' data-direction='" + dir + "'></div>";
		});
		this.selectFrame = $("<div class='ds-canvas-selectframe'>" + handles.join("") + "</div>");
		this.multipleSelectFrame = $("<div class='ds-canvas-multipleselect' />").appendTo(this.meta);
	},
	getSelectionFrameById: function (id) {
		return this.selectionFrames[typeof id === "string" ? id : (id instanceof Item ? id.get("id") : undefined)];
	},
	_addSelectionFrame: function (item) {
		var s = this.selectFrame.clone().css({
						top: item.y,
						left: item.x,
						width: item.width,
						height: item.height,
						webkitTransform: item.transform
					}).attr("data-itemId", item.get("id"));
		this.selectionFrames[item.get("id")] = s;
		this.meta.append(s);
	},
	_changeSelectionFrame: function (item) {
		this.getSelectionFrameById(item).css({
			top: item.y,
			left: item.x,
			width: item.width,
			height: item.height,
			webkitTransform: item.transform
		});
	},
	_removeSelectionFrame: function (m) {
		this.getSelectionFrameById(m).remove();
		delete this.selectionFrames[m.get("id")];
	},
	drawSelection: function (e) {
		if (e.dsType === "none") {
			switch (e.type) {
				case "dragstart":
				this.startPoint = {
					x: e.pageX,
					y: e.pageY
				};
				this.multipleSelectFrame.show();
				break;
				case "drag":
				var startX, startY, endX, endY, width, height, items;
				if (e.pageX < this.startPoint.x) {
					startX = e.pageX;
					endX = this.startPoint.x;
				} else {
					startX = this.startPoint.x;
					endX = e.pageX;
				}
				if (e.pageY < this.startPoint.y) {
					startY = e.pageY;
					endY = this.startPoint.y;
				} else {
					startY = this.startPoint.y;
					endY = e.pageY;
				}
				width = endX - startX;
				height = endY - startY;

				this.multipleSelectFrame.css({
					left: startX,
					top: startY,
					width: width,
					height: height
				});

				itemList.each(function (item) {
					SelectManager.toggleSelect(item, item.isAreaInItem(startX, startY, width, height));
				}, this);
				break;
				case "dragend": 
				this.multipleSelectFrame.removeAttr("style");
				break;
			}
		}
	},
	showSelectionFrame: function (e) {
		this.getSelectionFrameById(e.dsObjectId).addClass("ds-selected");
	},
	hideSelectionFrame: function (e) {
		this.getSelectionFrameById(e.dsObjectId).removeClass("ds-selected");
	},
	checkForSelect: function (e) {
		if (e.dsType === "item") {
			SelectManager.selectOnly(e.dsObject);
		} else {
			SelectManager.unselectAll();
		}
	},
	events: {
		"mousedown": "checkForSelect",
		"select": "showSelectionFrame",
		"unselect": "hideSelectionFrame",
		"dragstart": "drawSelection",
		"drag": "drawSelection",
		"dragend": "drawSelection"
	}
}))({
	collection: itemList,
	el: $(".ds-canvas")
});

root.supply({
	"SelectManager": SelectManager,
	"SelectManagerView": SelectManagerView
})

})(ds, this, Backbone, _, jQuery);