(function (root, global, Backbone, _, $) {
	if (!root || !global || !Backbone || !_ || !$) return;

var Item = root.Item,
	Page = root.Page,
	itemList = root.document.getCurrentPage().get("itemList");

var SelectManager = new (Backbone.Model.extend({
	initialize: function (attr) {
		this.selectedItems = {};
		this.selectedPages = {};

		attr.itemList
		.on("remove", function (m) {
			if (this.isSelected(m)) {
				_.delay(function (self) {self.unselect(m);}, 16, this);
			}
		}, this)
		.on("reset", this.unselectAll, this);
	},
	_isItem: function (obj) {
		return obj instanceof Item;
	},
	_isPage: function (obj) {
		return obj instanceof Page;
	},
	isSelected: function (obj) {
		var id;
		switch (typeof obj) {
			case "string": // We assume, it's the id.
				id = obj; break;
			case "object": // We assume, it's the instance
				typeof obj.get !== "function" || (id = obj.get("id")); break;
		}
		return id && id in this.selectedItems || id in this.selectedPages;
	},
	select: function (obj) {
		if (_.isArray(obj)) {
			return _.each(obj, this.select, this);
		}
		var id = obj.get("id"), isItem = this._isItem(obj);
		if (!this.isSelected(obj) && (isItem || this._isPage(obj))) {
			(isItem ? this.selectedItems : this.selectedPages)[id] = obj;
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
			//debugger;
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
		if (isItem || this._isPage(obj)) {
			// is valid

			if (typeof stateVal !== "boolean") {
				stateVal = !this.isSelected(obj);
			}
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
	},
	getSelectedItems: function () {
		return _.values(this.selectedItems);
	}
}))({
	"itemList": itemList
});



var SelectManagerView = new (Backbone.View.extend({
	initialize: function () {
		this.collection.on("add", this._addSelectionFrame, this);
		this.collection.on("change", this._changeSelectionFrame, this);
		this.collection.on("remove", this._removeSelectionFrame, this);

		SelectManager
		.on("select", this.showSelectionFrame, this)
		.on("unselect", this.hideSelectionFrame, this);

		this.meta = this.$(".ds-canvas-metalayer").eq(0);
		this.metapage = this.meta.find(".ds-canvas-page").eq(0);
		this.content = this.$(".ds-canvas-contentlayer").eq(0);

		this.selectionFrames = {};

		var handles = _.map("nw n ne e se s sw w".split(" "), function (dir) {
			return "<div class='ds-canvas-selectframe-handle ds-canvas-selectframe-handle-" + dir + "' data-direction='" + dir + "'></div>";
		});
		this.selectFrame = $("<div class='ds-canvas-selectframe ds-scale'>" + handles.join("") + "</div>");
		this.multipleSelectFrame = $("<div class='ds-canvas-multipleselect ds-scale' />").data("scaleproperty", "top left width height").appendTo(this.metapage);
	},
	getSelectionFrameById: function (id) {
		return this.selectionFrames[typeof id === "string" ? id : (id instanceof Item ? id.get("id") : null)] || $();
	},
	_addSelectionFrame: function (item) {
		var s = this.selectFrame.clone().data({
						"scaleproperty": "top left width height",
						"itemid": item.get("id")
					}).css({
						top: item.y,
						left: item.x,
						width: item.width,
						height: item.height,
						transform: item.transform
					});
		this.selectionFrames[item.get("id")] = s;
		this.metapage.append(s);
	},
	_changeSelectionFrame: function (item) {
		this.getSelectionFrameById(item).css({
			top: item.y,
			left: item.x,
			width: item.width,
			height: item.height,
			transform: item.transform
		});
	},
	_removeSelectionFrame: function (m) {
		this.getSelectionFrameById(m).remove();
		delete this.selectionFrames[m.get("id")];
	},
	/**
	 * This is the selection frame to select items.
	 */
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
		if (!e.isProcessed) return;
		if (e.dsType === "selectframe" || e.dsType === "selectframe-handle") {
			SelectManager.selectOnly(e.dsObject.dsObject);
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