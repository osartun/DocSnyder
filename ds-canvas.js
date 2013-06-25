(function (root, global, Backbone, _, $) {

	var SizeManager;

	root.demand(["SizeManager"], function () {
		SizeManager = root.SizeManager;
	})

	var Canvas = new (Backbone.Model.extend({
		defaults: {
			activeTool: "Default"
		}
	}));

	var CanvasView = new (Backbone.View.extend({
		initialize: function () {
			var prefix = "ds-canvas-";
			this.viewport = $("<div class='" + prefix + "viewport'/>").appendTo(this.$el);
			this.scrollport = $("<div class='" + prefix + "scrollport'/>").appendTo(this.viewport);

			this.templatelayer = $("<div class='" + prefix + "templatelayer'/>").appendTo(this.scrollport);
			this.contentlayer = $("<div class='" + prefix + "contentlayer'/>").appendTo(this.scrollport);
			this.metalayer = $("<div class='" + prefix + "metalayer'/>").appendTo(this.scrollport);

			this.page = {
				"template": $("<div class='" + prefix + "page'/>").appendTo(this.templatelayer),
				"content": $("<div class='" + prefix + "page'/>").appendTo(this.contentlayer),
				"metaWrapper": $("<div class='" + prefix + "page-wrapper'/>").appendTo(this.metalayer)
			};
			this.page.meta = $("<div class='" + prefix + "page' id='" + prefix + "page' />").appendTo(this.page.metaWrapper);
			root.demand(["document"], function () {
				this.initCanvas();
				root.document
				.on("change", this.initCanvas, this)
				.get("pageList").on("reset", this.initCanvas, this)
			}, this);
			Canvas.on("change", function (m,c) {
				if (m.changed) {
					this.setSize(m.get("width"), m.get("height"));
				}
			}, this);
		},
		setSize: function (width, height) {
			var
			curPage = root.document.getCurrentPage(),
			pageWidth = curPage.get("width"),
			pageHeight = curPage.get("height"),
			offsetWidth = (width - pageWidth) / 2,
			offsetHeight = (height - pageHeight) / 2;

			this.scrollport.css({
				width: width,
				height: height
			});
			$().add(this.page.template).add(this.page.content).css({
				top: offsetHeight,
				left: offsetWidth
			}).add(this.page.metaWrapper).css({
				width: pageWidth,
				height: pageHeight
			});
			this.page.metaWrapper.css({
				borderWidth: offsetHeight + "px " + offsetWidth + "px"
			});
			Canvas.trigger("setup", {
				pageWidth: pageWidth,
				pageHeight: pageHeight,
				width: width,
				height: height,
				pageStartX: offsetWidth,
				pageStartY: offsetHeight
			});
		},
		initCanvas: function (m,c) {
			var m = root.document.getCurrentPage(),
			width = m.get("width"), height = m.get("height"),
			containerWidth = SizeManager ? SizeManager.get("width") : 0,
			containerHeight = SizeManager ? SizeManager.get("height") : 0,
			canvasWidth = Canvas.get("width") || Math.max(containerWidth, width * 3),
			canvasHeight = Canvas.get("height") || Math.max(containerHeight, height * 3);

			if (!isNaN(canvasWidth) && !isNaN(canvasHeight)) {
				Canvas.set({
					pageWidth: width,
					pageHeight: height,
					width: canvasWidth,
					height: canvasHeight
				});
			}
		}
	}))({
		el: $(".ds-canvas"),
		model: Canvas
	});

	root.supply({
		"Canvas": Canvas
	});

})(ds, this, Backbone, _, jQuery);