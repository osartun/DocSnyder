(function (root, global, Backbone, _, $) {
	if (!root || !global || !Backbone || !_ || !$) return;

	/* Guides */
	var Guide = Backbone.Model.extend({
			validate: function(a) {
				if (a.axis !== "x" && a.axis !== "y") {
					return "Wrong value: The axis-attribute must either be 'x' or 'y'.";
				}
				if (typeof a.position != "number") {
					return "Wrong type: The guide's position must be a number.";
				}
			},
			initialize: function(a) {
				this.set({
					axis: a.axis,
					position: a.position,
					id: _.uniqueId("ds-canvas-guide-")
				});
			}
	}),
	GuideList = Backbone.Collection.extend({
		model: Guide,
		initialize: function() {
			UndoManager.register(this);
		},
		getGuideById: function (id) {
			return this.where({id: id})[0];
		}
	}),
	guideList = new GuideList;

	var dsGuideView = new (Backbone.View.extend({
	initialize: function() {
		this.collection.on("add", this._addGuide, this);
		this.collection.on("change", this._changeGuide, this);
		this.collection.on("remove", this._removeGuide, this);

		this.meta = this.$(".ds-canvas-metalayer");
		this.content = this.$(".ds-canvas-contentlayer");
		this._guideList = {};
	},
	_addGuide: function (m) {
		var guide = m; 
		this._guideList[guide.get("id")] = $("<div class='ds-canvas-guide' id='" + guide.get("id") + "' />").appendTo(this.meta);
		this._changeGuide(m);
	},
	_changeGuide: function (m) {
		var guide = m, guideEl = this.getGuideById(guide);
		if (guide.get("axis") === "y") {
			guideEl.addClass("ds-canvas-guide-horizontal").css({
				top: guide.get("position") + "px"
			})
		} else {
			guideEl.addClass("ds-canvas-guide-vertical").css({
				left: guide.get("position") + "px"
			})
		}
	},
	_removeGuide: function (m) {
		var guide = m;
		this.getGuideById(guide).remove();
		delete this._guideList[guide.get("id")];
	},
	getGuideById: function (id) {
		return this._guideList[ typeof id === "string" ? id : (id instanceof Guide ? id.get("id") : undefined)];
	},
	move: function (e) {
		if (e.dsType === "guide") {
			var horizontal = e.$target.hasClass("ds-canvas-guide-horizontal"),
				attribute = horizontal ? "top" : "left",
				position = horizontal ? e.pageY : e.pageX;

			if (e.type === "dragstart") {
				this.dragGuide = e.dsObject;
			}

			e.$target.css(attribute, position);

			if (e.type === "dragend") {
				this.dragGuide.set("position", position);
			}
		}
	},
	events: {
		"dragstart": "move",
		"drag": "move",
		"dragend": "move"
	}
}))({
	collection: guideList,
	el: $(".ds-canvas")
});

root.supply({
	"Guide": Guide,
	"guideList": guideList
});

})(ds, this, Backbone, _, jQuery);