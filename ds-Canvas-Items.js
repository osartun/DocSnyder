(function (root, global, Backbone, _, $) {
	if (!root || !global || !Backbone || !_ || !$) return;

var Item = root.Item,
	itemList = root.document.getCurrentPage().get("itemList"),
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
				height: m.height,
				display: m.visible ? "block" : "none",
				transform: m.transform
			});
		}, this);

		this.meta = this.$(".ds-canvas-metalayer .ds-canvas-page").eq(0);
		this.content = this.$(".ds-canvas-contentlayer .ds-canvas-page").eq(0);

		this.cache = {};
		this._itemList = {};
	},
	getItemById: function (id) {
		return this._itemList[ typeof id === "string" ? id : (id instanceof Item ? id.get("id") : undefined)];
	},
	_addItem: function (item) {
		var itemEl = $("<div class='ds-canvas-item ds-canvas-item-type-" + item.get("content").name + "' id='" + item.get("id") + "'></div>").css({
			width: item.width,
			height: item.height,
			left: item.x,
			top: item.y,
		}).appendTo(this.content);
		if (item.content) {
			itemEl.append(item.content.getView().el);
		}
		this._itemList[item.get("id")] = itemEl;
	},
	_removeItem: function (item) {
		this.getItemById(item).remove();
		delete this._itemList[item.get("id")];
	},
	_changeItem: function(item, c) {
		if (!item.changed.selected) {
			this.getItemById(item).css({
				width: item.width,
				height: item.height,
				left: item.x,
				top: item.y
			});
		}
	}
}))({
	collection: itemList,
	el: $(".ds-canvas")
});

root.supply({
	"ItemView": dsItemView
})
})(ds, this, Backbone, _, jQuery);