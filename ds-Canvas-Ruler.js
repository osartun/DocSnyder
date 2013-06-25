(function (root, global, Backbone, _, $) {
	var ScrollManager = root.ScrollManager,
		ScaleManager = root.ScaleManager,
		SizeManager = root.SizeManager,
		Canvas = root.Canvas,
		workingCanvasEl = document.createElement("canvas"),
		workingCanvasContext,
		hasCanvasSupport = workingCanvasEl.getContext && !!(workingCanvasContext = workingCanvasEl.getContext("2d")),
		hasDataURLSupport,
		testImage = new Image();
		testImage.onload = testImage.onerror = function(e){
			hasDataURLSupport = /load/.test(e.type);
			testImage = null;
		}
		testImage.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQIW2NkAAIAAAoAAggA9GkAAAAASUVORK5CYII=";

	var Ruler = new (Backbone.View.extend({
		lineLength: {
			"standard": 3,
			"tenth": 4,
			"seperator": 14
		},
		initialize: function () {
			this.canvasEl = $(".ds-canvas");
			this.canvasOffset = this.canvasEl.offset();
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

			root.SizeManager.on("change", function () {
				this.canvasOffset = this.canvasEl.offset();
			}, this)

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
		_createLinesImage: function (width, height, horizontal, lineData) {
			if (hasCanvasSupport) {
				var ctx = workingCanvasContext, canvas = ctx.canvas,
				i = 0, l = lineData.length, line, dataURL;
				canvas.width = width;
				canvas.height = height;

				ctx.lineWidth = 1;
				ctx.strokeStyle = "#000000";

				for (; i < l; i++) {
					line = lineData[i];
					// Because of this: http://stackoverflow.com/questions/9311428/draw-single-pixel-line-in-html5-canvas#answer-9311835
					// we do this:
					line.pos = ~~line.pos + 0.5;

					ctx.beginPath();
					if (horizontal) {
						ctx.moveTo(line.pos, height - line.length);
						ctx.lineTo(line.pos, height);
					} else {
						ctx.moveTo(width - line.length, line.pos);
						ctx.lineTo(width, line.pos);
					}
					ctx.stroke();
					ctx.closePath();
				}
				dataURL = canvas.toDataURL();
				ctx.clearRect(0, 0, width, height); // clean up
				return dataURL;
			}
		},
		_determineIntervals: function (scale) {
			var highestNumber = {
				horizontal: (this.page.width - this.page.startX)|0, // The complete canvas' width minus the offset where the page begins
				vertical: (this.page.height - this.page.startY)|0
			},
			pixelOffset = 1,
			pixelLength = {
				// How many pixels do these size declarations consume
				horizontal: this.letterLength.horizontal[("" + highestNumber.horizontal).length + pixelOffset],
				vertical: this.letterLength.vertical[("" + highestNumber.vertical).length + pixelOffset]
			},
			// We want the horizontal and the vertical rulers to have equal steps
			// to achieve that we determine the number which consumes the most pixels
			// regardless on which axis it is
			maxPixelLength = Math.max(pixelLength.horizontal, pixelLength.vertical),
			steps = this.steps, i, multiplier = 1, l = steps.length, step, minorStep, highlight;

			// Find the numbering interval by checking for pixel length
			// The numbering interval is the interval from one number to the next
			while (!step) {
				for (i = 0; i<l; i++) {
					if ((steps[i] * multiplier * scale) >= maxPixelLength) {
						step = steps[i] * multiplier;
						break;
					}
				}
				multiplier *= 10;
			}
			unitLength = step * scale;

			// Now, find the according partial interval
			// The partial interval is the interval between the short lines
			for (i = 0, multiplier = 1; i<=l; i++) {
				if (i === l) {
					// start all over again, with an increased multiplier
					i = 0;
					multiplier *= 10;
				}
				if (i*multiplier*scale >= this.minPxGap) {
					minorStep = i*multiplier;
					break;
				}
			}
			return {
				step: step,
				minorStep: minorStep,
				unitLength: unitLength,
				highlight: step / 2
			}
		},
		_setUpRuler: function (el, data, horizontal, scale, noScroll) {
			if (data.background) {
				el.css({
					"backgroundImage": data.background,
					"backgroundPosition": horizontal ? (data.offset * scale) + "px 0" : "0 " + (data.offset * scale) + "px"
				}).html(data.html);
			} else {
				el.html(data.html);
			}
			this.scrollTo(noScroll ? 0 : horizontal || ScrollManager.get("scrollTop"), noScroll ? 0 : !horizontal || ScrollManager.get("scrollLeft"));
		},
		setUpRuler: function (horizontal) {
			if (typeof horizontal === "boolean") {
				var orientation = horizontal ? "horizontal" : "vertical",
					el = this[orientation],
					attr = horizontal ? "width" : "height",
					pos = horizontal ? "left" : "top",
					axis = horizontal ? "X" : "Y",
					currentLength = horizontal ? this.horizontalWidth : this.verticalHeight,
					scale = ScaleManager.get("scale" + axis),
					// if the viewport is equal to the (scaled) scrollport size the user can't scroll
					isNoScroll = (Canvas.get(attr) * scale) <= SizeManager.get(attr);

				el[attr](currentLength * scale);

				// Fill in Ruler:
				if (this.rulerCache[orientation][scale]) {
					// We've already set up a ruler for this scale
					this._setUpRuler(el, this.rulerCache[orientation][scale], horizontal, scale, isNoScroll);
					return;
				}
				// We haven't set up a ruler for this scale, yet

				var steps = this._determineIntervals(scale), step = steps.step,
				minorStep = steps.minorStep, highlight = steps.highlight, unitLength = steps.unitLength,
				i, l, lines = "", className, background, width, height, lineData, line,
				rulerData = this.rulerCache[orientation][scale] = {
					offset: this.page["start" + axis] % step
				};

				if (hasCanvasSupport && hasDataURLSupport !== false) { // if hasDataURLSupport is undefined we can't know yet 
					// if Data-URIs are supported, however we assume it, because all relevant Browsers which support Canvas 
					// also support Data-URIs
					if (horizontal) {
						height = el.height();
						width = unitLength;
					} else {
						height = unitLength;
						width = el.width();
					}

					lineData = [{
						pos: 0,
						length: this.lineLength.seperator || 0
					}]

					for (i = minorStep; i < step; i += minorStep) {
						line = {};
						line.pos = i * scale;
						line.length = (i === highlight) ? this.lineLength.tenth : this.lineLength.standard || 0;
						lineData.push(line);
					}

					rulerData.background = "url('" + this._createLinesImage(width, height, horizontal, lineData) + "')";

					for (i = step, l = currentLength; i <= l; i += step) {
						lines += '<div class="ds-canvas-ruler-number-' + orientation + '"';
						lines += ' style="' + pos + ':' + (i + rulerData.offset) * scale + 'px;';
						lines += attr + ':' + unitLength + 'px;"';
						lines += '>' + Math.abs(i - this.page["start" + axis] + rulerData.offset) + '</div>';
					}					
				} else {
					for (i = minorStep, l = currentLength; i <= l; i += minorStep) {
						className = "ds-canvas-ruler-line-" + orientation;
						if (i%step === 0) {
							className += "-seperator";
						} else if (i === highlight) {
							className += "-tenth";
						}
						lines += '<div class="' + className + '" ';
						lines += 'style="' + pos + ':' + (i + rulerData.offset) * scale + 'px;"';
						lines += '/></div>';
						if (i%step === 0) {
							lines += '<div class="ds-canvas-ruler-number-' + orientation + '"';
							lines += ' style="' + pos + ':' + (i + rulerData.offset) * scale + 'px;';
							lines += attr + ':' + unitLength + 'px;"';
							lines += '>' + Math.abs(i + rulerData.offset - this.page["start" + axis]) + '</div>';
						}
					}
				}
				rulerData.html = lines;
				this._setUpRuler(el, rulerData, horizontal, scale, isNoScroll)
			}
		},
		showCoords: function (e) {
			this.coordIndicator.x.css("left", e.clientX - this.canvasOffset.left);
			this.coordIndicator.y.css("top", e.clientY - this.canvasOffset.top);
		},
		clearCache: function () {
			var prev = this.rulerCache;
			this.rulerCache = {
				horizontal: {},
				vertical: {}
			};
			return prev;
		},
		createRuler: function (canvasData) {
			this.clearCache();
			var prev = this.page;
			this.page = {
				startX: canvasData.pageStartX,
				startY: canvasData.pageStartY,
				width: canvasData.width,
				height: canvasData.height
			}
			if (canvasData.width !== this.horizontalWidth || canvasData.startX !== prev.startX) {
				this.horizontalWidth = canvasData.width;
				this.setUpRuler(true)
			}
			if (canvasData.height !== this.verticalHeight || canvasData.startY !== prev.startY) {
				this.verticalHeight = canvasData.height;
				this.setUpRuler(false);
			}
		},
		scrollTo: function (top, left) {
			if (_.isNumber(top) && top >= 0) {
				// scrolling happens often and fast, we have to be as speedy as possible
				// that's why we're bypassing jQuery and setting the styles directly
				this.vertical[0].style.marginTop = "-" + top + "px";
			}
			if (_.isNumber(left) && left >= 0) {
				this.horizontal[0].style.marginLeft = "-" + left + "px";
			}
		},
		scrollHandler: function (m, c) {
			var top, left, changed = m.changedAttributes();
			if ("scrollTop" in changed) {
				top = changed.scrollTop;
			}
			if ("scrollLeft" in changed) {
				left = changed.scrollLeft;
			}
			this.scrollTo(top, left);
		},
		resizeRulers: function (m, c) {
			if (m.changed) {
				if (m.changed.scaleX) {
					this.setUpRuler(true)
				}
				if (m.changed.scaleY) {
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