(function (root, global, Backbone, _, $, undefined) {
	var ScrollManager = root.ScrollManager,
		SizeManager = root.SizeManager,
		Canvas = root.Canvas,
		Page;

	var ScaleManager = new (Backbone.Model.extend({
		defaults: {
			scaleX: 1,
			scaleY: 1,
			scaleFactorX: 1,
			scaleFactorY: 1
		},
		step: 0.2,
		minScale: 0.1,
		maxScale: 24,
		setScale: function (x,y) {
			if (y == null) {
				y = x;
			}

			var scaleX = _.round(x,4), scaleY = _.round(y,4), factorX, factorY;
			if (scaleX >= this.minScale && scaleY >= this.minScale && scaleX <= this.maxScale && scaleY <= this.maxScale) {
				factorX = scaleX / this.get("scaleX");
				factorY = scaleY / this.get("scaleY");
				this.set({
					scaleX: scaleX,
					scaleY: scaleY,
					scaleFactorX: factorX,
					scaleFactorY: factorY
				})
			}
		},
		getScale: function () {
			return {
				x: this.get("scaleX"),
				y: this.get("scaleY")
			}
		},
		zoomIn: function () {
			this.setScale(this.get("scaleX") + this.step, this.get("scaleY") + this.step);
		},
		zoomOut: function () {
			this.setScale(this.get("scaleX") - this.step, this.get("scaleY") - this.step);
		}
	}))({"scaleX": 1, "scaleY": 1});

	new (Backbone.View.extend({
		initialize: function () {
			this.viewport = this.$el.parent();
			this.templatelayer = this.$(".ds-canvas-templatelayer");
			this.contentlayer = this.$(".ds-canvas-contentlayer");
			this.metalayer = this.$(".ds-canvas-metalayer");
			this.metapage = this.metalayer.find(".ds-canvas-page-wrapper");
			this.model.on("change", this.zoom, this);

			this.scaleX = ScaleManager.get("scaleX") || 1;
			this.scaleY = ScaleManager.get("scaleY") || 1;

			Canvas.on("setup", function (data) {
				this.canvasDimensions = data;
			}, this);
			root.demand(["page"], function () {
				Page = root.page;
			}, this);
			$(_.bind(this.attachCSSHooks, this));
		},
		numSplitRegExp: /^(-?[\d\.]+)(.*)/,
		classNameOfScaleElements: "ds-scale",
		zoom: function (m) {
			if (!"canvasDimensions" in this) return;
			var scaleX = m.get("scaleX"), scaleY = m.get("scaleY"),
				scaleFactorX = scaleX / m.previous("scaleX"), scaleFactorY = scaleY / m.previous("scaleY");

			if (this.canvasDimensions.width * scaleX < SizeManager.get("width")
				|| this.canvasDimensions.height * scaleY < SizeManager.get("height")) {
				// The canvas is smaller than the container. Don't let this happen!
				Canvas.set({
					width: Math.max(this.canvasDimensions.width / scaleX, SizeManager.get("width")),
					height: Math.max(this.canvasDimensions.height / scaleY, SizeManager.get("height"))
				});
				// So. Now, go on.
			}

			var pageWidth = Page.get("width") * scaleX,
				pageHeight = Page.get("height") * scaleY,
				canvasWidth = this.canvasDimensions.width * scaleX,
				canvasHeight = this.canvasDimensions.height * scaleY,
				offsetTop = this.canvasDimensions.pageStartY * scaleX,
				offsetLeft = this.canvasDimensions.pageStartX * scaleY,
				numSplitRegExp = this.numSplitRegExp;
			this.templatelayer.add(this.contentlayer).css({
				"transform": "scaleX(" + scaleX + ") scaleY(" + scaleY + ")"
			});
			this.metapage.css({
				width: pageWidth + (scaleX < 1 ? 2 * scaleX : 2 / scaleX),
				height: pageHeight + (scaleY < 1 ? 2 * scaleY : 2 / scaleY),
				borderWidth: offsetTop + "px " + (offsetLeft - 2) + "px " + (offsetTop - 2) + "px " + offsetLeft + "px"
			})
			this.metalayer.add(this.$el).width(canvasWidth).height(canvasHeight)
			.end().find("." + this.classNameOfScaleElements).each(function () {
				var $el = $(this), scaleproperties, styles = {}, fn = function (prop, axis, i, v) {
					var match = numSplitRegExp.exec(v);
					if (match) {
						return (axis === "x" ? match[1] * scaleFactorX : match[1] * scaleFactorY) + match[2];
					}
					return v;
				};
				scaleproperties = $el.data("scaleproperty").split(" ");
				_.each(scaleproperties, function (prop) {styles[prop] = _.partial(fn, prop, /top|height/.test(prop) ? "y" : "x")});
				$el.css(styles);
			});
			var sizeWidthHalf = SizeManager.get("width") / 2, sizeHeightHalf = SizeManager.get("height") / 2,
				scrollTop = ScrollManager.get("scrollTop"), scrollLeft = ScrollManager.get("scrollLeft");

			scrollTop = ~~Math.round((scrollTop + sizeHeightHalf) * scaleFactorY - sizeHeightHalf), 
			scrollLeft = ~~Math.round((scrollLeft + sizeWidthHalf) * scaleFactorX - sizeWidthHalf);
			ScrollManager.set({
				"scrollTop": scrollTop,
				"scrollLeft": scrollLeft
			});

			this.scaleX = scaleX;
			this.scaleY = scaleY;
		},
		attachCSSHooks: function () {
			var oldHooks = {
				width: $.cssHooks.width,
				height: $.cssHooks.height,
				top: $.cssHooks.top,
				left: $.cssHooks.left
			}, 
			that = this,
			numSplitRegExp = this.numSplitRegExp,
			newHooks = {},
			curCSS = (function () {
				// This is a slightly modified copy of jQuery's internal curCSS function from jQuery 1.9.0
				// Regex dependencies
				var rposition = /^(top|right|bottom|left)$/,
					rmargin = /^margin/,
					rnumnonpx = /^([+-]?(?:d*.|)d+(?:[eE][+-]?d+|))(?!px)[a-z%]+$/i;
				if ( window.getComputedStyle ) {
					return function( elem, name ) {
						var width, minWidth, maxWidth,
							computed = window.getComputedStyle( elem, null ),

							// getPropertyValue is only needed for .css('filter') in IE9, see #12537
							ret = computed ? computed.getPropertyValue( name ) || computed[ name ] : undefined,
							style = elem.style;

						if ( computed ) {

							// A tribute to the "awesome hack by Dean Edwards"
							// Chrome < 17 and Safari 5.0 uses "computed value" instead of "used value" for margin-right
							// Safari 5.1.7 (at least) returns percentage for a larger set of values, but width seems to be reliably pixels
							// this is against the CSSOM draft spec: http://dev.w3.org/csswg/cssom/#resolved-values
							if ( rnumnonpx.test( ret ) && rmargin.test( name ) ) {

								// Remember the original values
								width = style.width;
								minWidth = style.minWidth;
								maxWidth = style.maxWidth;

								// Put in the new values to get a computed value out
								style.minWidth = style.maxWidth = style.width = ret;
								ret = computed.width;

								// Revert the changed values
								style.width = width;
								style.minWidth = minWidth;
								style.maxWidth = maxWidth;
							}
						}

						return ret;
					};
				} else if ( document.documentElement.currentStyle ) {
					return function( elem, name ) {
						var left, rs, rsLeft,
							computed = elem.currentStyle,
							ret = computed ? computed[ name ] : undefined,
							style = elem.style;

						// Avoid setting ret to empty string here
						// so we don't default to auto
						if ( ret == null && style && style[ name ] ) {
							ret = style[ name ];
						}

						// From the awesome hack by Dean Edwards
						// http://erik.eae.net/archives/2007/07/27/18.54.15/#comment-102291

						// If we're not dealing with a regular pixel number
						// but a number that has a weird ending, we need to convert it to pixels
						// but not position css attributes, as those are proportional to the parent element instead
						// and we can't measure the parent instead because it might trigger a "stacking dolls" problem
						if ( rnumnonpx.test( ret ) && !rposition.test( name ) ) {

							// Remember the original values
							left = style.left;
							rs = elem.runtimeStyle;
							rsLeft = rs && rs.left;

							// Put in the new values to get a computed value out
							if ( rsLeft ) {
								rs.left = elem.currentStyle.left;
							}
							style.left = name === "fontSize" ? "1em" : ret;
							ret = style.pixelLeft + "px";

							// Revert the changed values
							style.left = left;
							if ( rsLeft ) {
								rs.left = rsLeft;
							}
						}

						return ret === "" ? "auto" : ret;
					};
				}
			})(),
			isScaledElement = (function (className) {
				if ("classList" in document.createElement("div")) {
					return function (elem) {
						return elem.classList.contains(className);
					}
				} else {
					return function (elem) {
						return (" " + (elem.className || "") + " ").indexOf(" " + className + " ") > -1;
					}
				}
			})(this.classNameOfScaleElements);

			_.each({"width": "X", "height": "Y", "left": "X", "top": "Y"}, function (axis, prop) {
				newHooks[prop] = {
					get: function (elem, computed, extra) {
						var match, value = (oldHooks[prop] && oldHooks[prop]["get"]) ? oldHooks[prop]["get"](elem, computed, extra) : 
									computed ? curCSS(elem, prop) : elem.style[prop];
						if (typeof value === "string" && isScaledElement(elem) && (" " + ($(elem).data("scaleproperty")||"") + " ").indexOf(" " + prop + " ") > -1) {
							if ((match = numSplitRegExp.exec(value))) {
								return (match[1] / that["scale" + axis]) + match[2];
							}
						}
						return value;
					},
					set: function (elem, value) {
						var match, value = (oldHooks[prop] && "set" in oldHooks[prop]) ? oldHooks[prop]["set"](elem, value) : value;
						if (typeof value === "string" && isScaledElement(elem) && (" " + ($(elem).data("scaleproperty")||"") + " ").indexOf(" " + prop + " ") > -1) {
							if ((match = numSplitRegExp.exec(value))) {
								return (match[1] * that["scale" + axis]) + match[2];
							}
						}
						return value;
					}
				}
			});
			_.extend($.cssHooks, newHooks);
		}
	}))({
		el: $(".ds-canvas-scrollport"),
		model: ScaleManager
	});

	root.supply({
		"ScaleManager": ScaleManager
	});
})(ds, this, Backbone, _, jQuery);