(function (root, global, Backbone, _, $, undefined) {
	var Canvas = root.Canvas,
		SizeManager = root.SizeManager;

	var ScrollManager = new (Backbone.Model)({scrollTop: 0, scrollLeft: 0});

	var counter = 0;

	new (Backbone.View.extend({
		initialize: function () {
			this._checkOffset = _.bind(this._checkOffset, this);

			var canvasDimensions = {
				width: 1,
				height: 1
			}

			Canvas.on("setup", function (data) {
				var scrollTop = ScrollManager.get("scrollTop") || 0,
					scrollLeft = ScrollManager.get("scrollLeft") || 0,
					relY = (scrollTop / canvasDimensions.height) || ((data.height - SizeManager.get("height")) / 2) / data.height,
					relX = (scrollLeft / canvasDimensions.width) || ((data.width - SizeManager.get("width")) / 2) / data.width ;
				canvasDimensions = data;
				ScrollManager.set({
					scrollTop: ~~(data.height * relY),
					scrollLeft: ~~(data.width * relX)
				})
			}, this);

			this.model.on("change", function (m) {
				if (m.get("scrollTop") !== this.position.scrollTop || m.get("scrollLeft") !== this.position.scrollLeft) {
					this.position = {
						scrollTop: m.get("scrollTop"),
						scrollLeft: m.get("scrollLeft")
					};
					this.$el.scrollTop(m.get("scrollTop")).scrollLeft(m.get("scrollLeft"));
				}
			}, this);

			SizeManager
			.on("change:width", function (m, width) {
				var previousWidth = m.previousAttributes().width,
					diff = width - previousWidth,
					scaleX = root.ScaleManager ? root.ScaleManager.get("scaleX") : 1,
					scrollLeft = this.position.scrollLeft;
				ScrollManager.set("scrollLeft", scrollLeft - (diff/2) / scaleX);
			}, this)
			.on("change:height", function (m, height) {
				var previousHeight = m.previousAttributes().height,
					diff = height - previousHeight,
					scaleY = root.ScaleManager ? root.ScaleManager.get("scaleY") : 1,
					scrollTop = this.position.scrollTop;
				ScrollManager.set("scrollTop", scrollTop - (diff/2) / scaleY);
			}, this)

			this.offset = {
				x: 0,
				y: 0
			};
			this._getScrollingPosition();
			this.isScrolled = false;
			this.checkOffsetIsRequested = false;
		},
		_getScrollingPosition: function () {
			this.position = {
				scrollTop: this.$el.scrollTop(),
				scrollLeft: this.$el.scrollLeft()
			};
			this.model.set(this.position);
		},
		_checkOffset: function () {
			this.checkOffsetIsRequested = false;
			if (this.isScrolled) {
				this.isScrolled = false;
				this._getScrollingPosition();
			}
		},
		scrollHandler: function (e) {
			e.stopImmediatePropagation();
			this.isScrolled = true;
			if (!this.checkOffsetIsRequested) {
				this.checkOffsetIsRequested = true;
				window.requestAnimationFrame(this._checkOffset);
			}
		},
		events: {
			"scroll": "scrollHandler"
		}
	}))({
		el: $(".ds-canvas-viewport"),
		model: ScrollManager
	});

	root.supply({
		"ScrollManager": ScrollManager
	})
})(ds, this, Backbone, _, jQuery);