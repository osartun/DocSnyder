(function (root, global, Backbone, _, $) {
	var ScrollManager = root.ScrollManager,
		ScaleManager = root.ScaleManager,
		Canvas = root.Canvas;

	var Ruler = new (Backbone.View.extend({
		initialize: function () {
			this.canvasEl = $(".ds-canvas");
			this.verticalWrapper = this.$el.eq(0);
			this.vertical = this.verticalWrapper.children().eq(0);
			this.horizontalWrapper = this.$el.eq(1);
			this.horizontal = this.horizontalWrapper.children().eq(0);

			this.coordIndicator = {
				x: this.horizontalWrapper.children().eq(1),
				y: this.verticalWrapper.children().eq(1)
			}

			this.horizontalWidth = 0;
			this.verticalHeight = 0;

			this.letterLength = {
				horizontal: {},
				vertical: {},
				maxLength: 10
			};
			this.measureLetterlengths();

			this.showCoords = _.bind(this.showCoords, this);

			this.activate();
		},
		measureLetterlengths: function () {
			var body = document.body,
				textNode = document.createTextNode(""),
				testEl = document.createElement("div"),
				measure = function (orientation) {
					testEl.className = "ds-canvas-ruler-number-" + orientation;
					for (var i = 1, l = this.letterLength.maxLength, text = ""; i <= l; i++) {
						text += "0";
						textNode.nodeValue = text;
						this.letterLength[orientation][i] = testEl.offsetWidth;
					}
				};
			testEl.appendChild(textNode);
			body.appendChild(testEl);

			_.each(["horizontal", "vertical"], measure, this);

			body.removeChild(testEl); // clean up
		},
		steps: [1,2,5], // numbering intervals: 1,2,5,10,20,50,100,200,500,1000,2000,5000,...
		minPxGap: 4, // the minimum gap between the lines
		activate: function () {
			this.$el.show();
			Canvas.on("setup", this.createRuler, this);
			ScrollManager.on("change", this.scrollHandler, this);
			ScaleManager.on("change", this.resizeRulers, this);
			this.canvasEl.on("mousemove", this.showCoords);
		},
		deactivate: function () {
			this.$el.hide();
			Canvas.off("setup", this.createRuler);
			ScrollManager.off("change", this.scrollHandler);
			ScaleManager.off("change", this.resizeRulers);
			this.canvasEl.off("mousemove", this.showCoords);
		},
		setUpRuler: function (horizontal) {
			if (typeof horizontal === "boolean") {
				var orientation = horizontal ? "horizontal" : "vertical",
					el = this[orientation],
					attr = horizontal ? "width" : "height",
					pos = horizontal ? "left" : "top",
					axis = horizontal ? "X" : "Y";
				var currentLength = horizontal ? this.horizontalWidth : this.verticalHeight,
					scale = ScaleManager.get("scale" + axis);

				el[attr](currentLength * scale);


				// Fill in Ruler:
				if (this.rulerCache[orientation][scale]) {
					el.html(this.rulerCache[orientation][scale]);
					return;
				}

				var highestNumber = {
					horizontal: this.page.startX + this.page.width,
					vertical: this.page.startY + this.page.height
				}, pixelLength = {
					horizontal: this.letterLength.horizontal[("" + highestNumber.horizontal).length],
					vertical: this.letterLength.vertical[("" + highestNumber.vertical).length]
				}, maxPixelLength = Math.max(pixelLength.horizontal, pixelLength.vertical),
				i, multiplier = 1, l = this.steps.length, step, minorStep, lines = "", className, highlight;

				// Find the numbering interval by checking for pixel length
				while (!step) {
					for (i = 0; i<l; i++) {
						if ((this.steps[i] * multiplier) >= (maxPixelLength / scale)) {
							step = this.steps[i] * multiplier;
							break;
						}
					}
					multiplier *= 10;
				}

				// Now, find the according partial-interval:
				for (i = 0, multiplier = 1; i<=l; i++) {
					if (i === l) {
						i = 0;
						multiplier *= 10;
					}
					if (i*multiplier*scale >= this.minPxGap) {
						minorStep = i*multiplier;
						break;
					}
				}
				highlight = i%5 !== 0;

				for (i = minorStep, l = currentLength; i <= l; i += minorStep) {
					className = "ds-canvas-ruler-line-" + orientation;
					if (i%step === 0) {
						className += "-seperator";
					} else if (highlight && i%5 === 0) {
						className += "-tenth";
					}
					lines += '<div class="' + className + '" ';
					lines += 'style="' + pos + ':' + (i * scale) + 'px;"';
					lines += '/></div>';
					if (i%step === 0) {
						lines += '<div class="ds-canvas-ruler-number-' + orientation + '"';
						lines += ' style="' + pos + ':' + (i * scale) + 'px;';
						lines += attr + ':' + (step * scale) + 'px;"';
						lines += '>' + Math.abs(i - this.page["start" + axis]) + '</div>';
					}
				}
				this.rulerCache[orientation][scale] = lines;
				el.html(lines);
			}
		},
		showCoords: function (e) {
			this.coordIndicator.x.css("left", e.clientX);
			this.coordIndicator.y.css("top", e.clientY);
		},
		createRuler: function (e) {
			this.rulerCache = {
				horizontal: {},
				vertical: {}
			};
			this.page = {
				startX: e.pageStartX,
				startY: e.pageStartY,
				width: e.width,
				height: e.height
			}
			if (e.width !== this.horizontalWidth) {
				this.horizontalWidth = e.width;
				this.setUpRuler(true)
			}
			if (e.height !== this.verticalHeight) {
				this.verticalHeight = e.height;
				this.setUpRuler(false);
			}
		},
		scrollHandler: function (m, c) {
			if (c && c.changes) {
				global.requestAnimationFrame(_.bind(function () {
					if (c.changes.scrollTop) {
						this.vertical[0].style.marginTop = "-" + m.get("scrollTop") + "px";
					}
					if (c.changes.scrollLeft) {
						this.horizontal[0].style.marginLeft = "-" + m.get("scrollLeft") + "px";
					}
				}, this));
			}
		},
		resizeRulers: function (m, c) {
			if (c && c.changes) {
				if (c.changes.scaleX) {
					this.setUpRuler(true)
				}
				if (c.changes.scaleY) {
					this.setUpRuler(false);
				}
			}
		},
		onmousewheel: function (e) {
			if ((e.target.className).indexOf("vertical") > -1) {
				ScrollManager.set("scrollTop", ScrollManager.get("scrollTop") + e.originalEvent.wheelDeltaY)
			} else {
				ScrollManager.set("scrollLeft", ScrollManager.get("scrollLeft") + e.originalEvent.wheelDeltaX)
			}
		},
		events: {
			//"mousewheel": "onmousewheel"
		}
	}))({
		el: $(".ds-canvas-ruler-container").add(".ds-canvas-ruler-corner")
	});

	root.supply({
		"RulerManager": Ruler
	})
})(ds, this, Backbone, _, jQuery);