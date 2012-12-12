(function(win, undefined) {
	// "global" variables within this closure scope
	var $ = win.jQuery,
		_ = win._,
		Backbone = win.Backbone,
		root = win.ds || {},
		dsCanvas = root.canvas || {};

	$.extend({
		/**
		 * A static jQuery-method.
		 * @param {number} x The x-coordinate of the Point.
		 * @param {number} y The y-coordinate of the Point.
		 * @param {Element} until (optional) The element at which traversing should stop. Default is document.body
		 */
		elementsFromPoint: function(x,y, until) {
			until || (until = document.body); // Stop traversing here
			var elements = $(), current, i;
			while ( (current = $(document.elementFromPoint(x,y))) && current.length > 0 && !current.is(until)) {
				elements = elements.add(current);
				current.css("display", "none");
			}
			elements.css("display", ""); // Remove display: none
			return elements;
		}
	});

	_.mixin({
		capitalize: function(string) {
			return string.charAt(0).toUpperCase() + string.substring(1);
		},
		isNumber: function (nr) {
			return typeof nr === "number" && !isNaN(nr);
		},
		testPerformance: function(fn, duration) {
			_.isNumber(duration) || (duration = 1000);
			var end = Date.now() + duration, i = 0;
			while (Date.now() < end) {
				fn();
				i++;
			}
			return i;
		}
	});

	_.each("Function String Number Date RegExp".split(" "), function(name) {
		_["are" + name + "s"] = function () {
			return _.all(_.toArray(arguments), _["is" + name]);
		}
	});


	/* Guides */
	var	Guide = Backbone.Model.extend({
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
				})
			}
	}),
	GuideList = Backbone.Collection.extend({
		model: Guide,
		getGuideById: function (id) {
			return this.where({id: id})[0];
		}
	}),
	guideList = new GuideList();


	/* Items */
	var Item = Backbone.Model.extend({
			validate: function (a) {
				if (!_.areNumbers(a.width, a.height, a.x, a.y, a.rotation)) {
					return "Wrong type: The values 'width', 'height', 'x', 'y' and 'rotation' must be numbers.";
				}
				if (typeof a.selected !== "boolean") {
					return "Wrong type: The value 'selected' must be of type Boolean.";
				}
			},
			isAreaInItem: function (x,y, width, height, fullyContained) {
				var endX = x + width, endY = y + height;
				return fullyContained ?
					x >= this.x && y >= this.y && endX <= this.endX && endY <= this.endY :
					x >= this.x || y >= this.y || endX <= this.endX || endY <= this.endY; // TODO: Do this right!
			},
			isPointInItem: function (x,y) {
				return this.isAreaInItem(x,y,0,0,true);
			},
			reset: function(model, changes) {
				changes.changes === undefined  || (changes = changes.changes);
				if (changes.x || changes.y || changes.width || changes.height) {
					var x = this.get("x"),
						y = this.get("y"),
						width = this.get("width"),
						height = this.get("height")
					_.extend(this, this.attributes, {
						endX: x + width,
						endY: y + height,
						centerX: x + (width/2),
						centerY: y + (height/2)
					})
				}
			},
			initialize: function (a) {
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
					itemId: _.uniqueId("ds-canvas-item-")
				}));
				this.reset(this, data);
				this.on("change", this.reset, this);
			}
	}),
		ItemList = Backbone.Collection.extend({
			model: Item,
			getItemById: function (itemId) {
				return this.where({itemId: itemId})[0];
			}
		}),
		itemList = new ItemList();

	var Page = Backbone.Model.extend({
		initialize: function (attr) {
			this.set({
				"scale": 1
			})
			this.itemList = attr.itemList;
		},
		getItemsOfArea: function (x,y, width, height, fullyContained) {
			if (fullyContained === undefined) fullyContained = true;
			return _.filter(this.itemList.models, function (item) {
				return item.isAreaInItem(x,y,width,height,fullyContained);
			});
		},
		getItemsOfPoint: function (x,y) {
			return _.filter(this.itemList.models, function (item) {
				return item.isPointInItem(x,y);
			})
		},
		getItemOfPoint: function (x,y) {
			return this.getItemsOfPoint(x,y).pop();
		}
	});

	var page = new Page({
		itemList: itemList
	});

	/* EventDelegator */
	var EventDelegator = new (Backbone.View.extend({
		initialize: function () {
			this.cache = {};
			this.meta = $(".ds-canvas-metalayer");
			this.content = $(".ds-canvas-contentlayer");
			this.containerOffset = this.$el.offset();
/*			page.on("change:scale", function (m, c) {
				this.scale = c.scale;
			}, this);*/
			this.isMouseDown = false;
			this.isDrag = false;
		},
		detectDOMTarget: function (e) {
			var target = $(e.target), x = e.pageX, y = e.pageY;
			if (target.is(this.meta)) {
				// Click was pointed on no specific element on the metalayer (guides for example), 
				// but rather aimed at an element beneath it. So let's figure out which element 
				// was meant.
				target = $.elementsFromPoint(x,y, this.content)
					.filter(".ds-canvas-item"); // We're in normal mode now, so we aim at item-Elements
			}
			return target.get(-1);
		},
		getTargetType: function (domNode, e) {
			if (domNode === undefined) return "none";
			var classList = domNode.classList;
			return _.find("item guide selectframe-handle selectframe".split(" "), function (type) {
				return classList.contains("ds-canvas-" + type);
			}) || "none";
		},
		getDSTargetObject: function (type, domNode, e) {
			if (domNode === undefined) return {};
			var object, id = domNode.id, $node, itemId, $item;
			switch (type) {
				case "item": object = itemList.getItemById(id); break;
				case "guide": object = guideList.getGuideById(id); break;
				case "selectframe":
				case "selectframe-handle": object = _.extend(($node = $(domNode)).data(), {
					itemId: (itemId = ($node.hasClass("ds-canvas-selectframe-handle") ? $node.parent() : $node).data().itemid),
					$itemEl: ($item = this.content.find("#" + itemId)),
					itemEl: $item.get(0),
					item: itemList.getItemById(itemId)
				}); break;
			}
			return object || {};
		},
		getPageRelativeCoords: function (axis, current) {
			if (axis === "x" || axis === "y") {
				var topLeft = axis === "x" ? "left" : "top";
				return current - this.containerOffset[topLeft];
			}
		},
		processEvent: function (e) {
			if (e.isProcessed || e === this.cache.event || e.target === null) return; // We have triggered this event, so don't process it another time

			e.preventDefault();
			e.stopImmediatePropagation();

			if (e.type === "click") return; // We detect clicks ourselves to distinguish them from drags

			var targetDOMElement = this.cache.domNode,
				targetType = this.cache.type,
				targetDSObject = this.cache.dsObject,
				pageX = this.getPageRelativeCoords("x", e.pageX),
				pageY = this.getPageRelativeCoords("y", e.pageY),
				event, eType = e.type, $target;

			// Drag-Detection
			if (eType === "mousedown") {
				this.isMouseDown = true;
			} else if (eType === "mousemove" && this.isMouseDown) {
				if (!this.isDrag) {
					this.isDrag = true;
					eType = "dragstart"
				} else {
					eType = "drag"
				}
			} else if (eType === "mouseup") {
				this.isMouseDown = false;
				if (this.isDrag) {
					this.isDrag = false;
					eType = "dragend";
				} else {
					// The mouse is up, but it was no drag. So, it's a click
					eType = "click";
				}
			}

			if (eType.indexOf("drag") === 0 && targetType !== "item") {
				// This is a drag (dragstart, drag or dragend)
				// Drags usually refer to their drag-target, so let's just access 
				// our cache instead of retrieving the target again
				this.cache.event = e;
			} else if (this.cache.target !== e.target || e.target.className.indexOf("ds-canvas-metalayer") > -1) {
				// If we had this target last time already, skip targetDetection and access our cache
				// Except if the target is the metalayer which means the actual target is underneath it
				targetDOMElement = this.detectDOMTarget(_.extend(e, {
					pageX: pageX,
					pageY: pageY
				}));
				if (this.cache.domNode !== targetDOMElement) { // Well, now we know it's really another target
					targetType = this.getTargetType(targetDOMElement, e);
					targetDSObject = this.getDSTargetObject(targetType, targetDOMElement, e);
					// Overwrite our cache
					_.extend(this.cache, {
						event: e,
						target: e.target,
						domNode: targetDOMElement,
						type: targetType,
						dsObject: targetDSObject
					});
				}
			}

			$target = $(targetDOMElement);

			event = new $.Event(eType, {
				isProcessed: true,
				type: eType,
				pageX: pageX,
				pageY: pageY,
				target: targetDOMElement,
				$target: $target,
				dsObject: targetDSObject,
				dsType: targetType,
				getPositionInTarget: (function () {
					// Here's the deal: Sometimes you need to know the 
					// cursor's position within the targetDOMElement.
					// I thought about retrieving it centrally before the 
					// Eventobject is triggered so that not every listener
					// has to retrieve this data. The problem: In 99% of 
					// published events you don't need this data and 
					// retrieving it would just slow everything down.
					// That's why I chose this solution: get the data on 
					// demand and cache it internally in a closure. That
					// way we have retrieved it centerally and not every
					// listener has to retrieve it themselves and at the
					// same time we don't produce the massive overhead
					// that would slow everything down.
					var position, positionInTarget, pX = pageX, pY = pageY;
					return function() {
						return positionInTarget || ((position = $target.position())
							&& (positionInTarget = {
								x: pX - position.left,
								y: pY - position.top
							}));
					};
				})()
			});

			($target.length ? $target : this.content).trigger(event);
		},
		events: {
			"mousedown": "processEvent",
			"mousemove": "processEvent",
			"mouseup": "processEvent",
			"click": "processEvent"
		}
	}))({
		el: $(".ds-canvas")
	});
	var SnapManager = new (Backbone.Model.extend({
		defaults: {
			range: 10,
			snapTo: {
				guides: true,
				itemsStart: false,
				itemsCenter: false,
				itemsEnd: false
			}
		},
		_getPositions: function (axis, type) {
			return this["_" + type + axis.toUpperCase()];
		},
		_addPosition: function (axis, type, position, dsObjectId) {
			this._getPositions(axis, type)[position] = dsObjectId;
		},
		_removePosition: function (axis, type, dsObjectId) {
			var i, positions = this._getPositions(axis, type);
			for (i in positions) {
				if (positions[i] === dsObjectId) {
					return delete positions[i];
				}
			}
			return false;
		},
		_changePosition: function (axis, type, position, dsObjectId) {
			this._removePosition(axis, type, dsObjectId);
			this._addPosition(axis, type, position, dsObjectId);
		},
		_getSnapPositionsFromUntil: function (axis, type, from, until) {
			var i, positions = this._getPositions(axis, type), posInRange = [];
			for (i in positions) {
				if (i >= from && i <= until) posInRange.push(i);
			}
			return from < until ? posInRange : posInRange.reverse();
		},
		_getSnapPositionsInRange: function (axis, type, position, range) {
			return this._getSnapPositionsFromUntil(axis, type, position - range, position + range);
		},
		_detectSnapForCoord: function (axis, position, range) {
			var type, types = this.get("snapTo"), snapTo, res, diff, closestDiff = range;
			for (type in types) {
				if (types[type]) {
					if (type === "itemsStart") type = "items";
					snapTo = this._getSnapPositionsInRange(axis, type, position, range)[0];
					if (snapTo !== undefined && (diff = Math.abs(snapTo - position)) < closestDiff) {
						closestDiff = diff;
						res = {
							"adjustTo": type !== "items" ? type : "itemsStart",
							"snapTo": parseInt(snapTo),
							"dsObjectId": this._getPositions(axis, type)[snapTo],
							"diff": diff,
							"direction": snapTo > position ? 1 : -1
						};
					}
				}
			}
			return res;
		},
		_detectSnapForCoords: function (attrs, range) {
			if (range === undefined) range = this.get("range");
			var attr, axis, position, snapX, snapY, diffX, diffY, closestDiffX = closestDiffY = range,
			res = {snapX: undefined, snapY: undefined};
			for (attr in attrs) {
				axis = attr.substr(-1).toLowerCase();
				position = attrs[attr];
				if (_.isNumber(position)) {
					if (axis === "x") {
						snapX = this._detectSnapForCoord(axis, position, range);
						if (snapX && snapX.diff < closestDiffX) {
							snapX.adjustWhat = attr;
							snapX.axis = axis;
							res.snapX = snapX;
						}
					} else if (axis === "y") {
						snapY = this._detectSnapForCoord(axis, position, range);
						if (snapY && snapY.diff < closestDiffY) {
							snapY.adjustWhat = attr;
							snapY.axis = axis;
							res.snapY = snapY;
						}
					}
				}
			}
			return res;
		},
		snapRectangle: function (startX, startY, width, height, range) {
			var test = {
				startX: startX,
				centerX: parseInt(startX + width/2),
				endX: startX + width,
				startY: startY,
				centerY: parseInt(startY + height/2), //centerY
				endY: startY + height // endY
			}, res = _.extend({
				"x": startX,
				"y": startY,
				"width": width,
				"height": height
			}, this._detectSnapForCoords(test, range));
			
			if (res.snapX) {
				res.x = res.snapX.snapTo;
				width -= res.snapX.diff * res.snapX.direction;
				res.width = width;
				if (res.snapX.adjustWhat === "centerX") {
					res.x -= width/2;
				} else if (res.snapX.adjustWhat === "endX") {
					res.x -= width;
				}
			}
			if (res.snapY) {
				res.y = res.snapY.snapTo;
				height -= res.snapY.diff * res.snapY.direction;
				res.height = height;
				if (res.snapY.adjustWhat === "centerY") {
					res.y -= height/2;
				} else if (res.snapY.adjustWhat === "endY") {
					res.y -= height;
				}
			}
			res.cssPosition = {
				"top": res.y,
				"left": res.x
			};
			res.cssDimension = {
				"width": res.width,
				"height": res.height
			};
			return res;
		},
		initialize: function (attr) {
			_.extend(this, {
				"guides": attr.guides,
				"items": attr.items,
				"_guidesX": {},
				"_guidesY": {},
				"_itemsX": {},
				"_itemsY": {},
				"_itemsCenterX": {},
				"_itemsCenterY": {},
				"_itemsEndX": {},
				"_itemsEndY": {}
			});

			var itemAttr = ["x", "y", "centerX", "centerY", "endX", "endY"];

			this.guides.on("add", function (m) {
				this._addPosition(m.get("axis"), "guides", m.get("position"), m.get("id"));
			}, this);
			this.guides.on("change:position", function (m) {
				this._changePosition(m.get("axis"), "guides", m.get("position"), m.get("id"));
			}, this);
			this.guides.on("remove", function (m) {
				this._removePosition(m.get("axis"), "guides", m.get("position"), m.get("id"));
			}, this);

			this.items.on("add", function (m) {
				var i, attr, id = m.get("itemId");
				for (i in itemAttr) {
					attr = itemAttr[i];
					this._addPosition(attr.substr(-1).toLowerCase(), "items" + _.capitalize(attr).slice(0,-1), m[attr], id);
				}
			}, this);
			this.items.on("change:position", function (m) {
				var i, attr, id = m.get("itemId");
				for (i in itemAttr) {
					attr = itemAttr[i];
					this._changePosition(attr.substr(-1).toLowerCase(), "items" + _.capitalize(attr).slice(0,-1), m[attr], id);
				}
			}, this);
			this.items.on("remove", function (m) {
				var i, attr, id = m.get("itemId");
				for (i in itemAttr) {
					attr = itemAttr[i];
					this._removePosition(attr.substr(-1).toLowerCase(), "items" + _.capitalize(attr).slice(0,-1), id);
				}
			}, this);
		}
	}))({
		guides: guideList,
		items: itemList
	});


	/**
	*
	*
	*	Views
	*
	*
	**/

	var dsGuideView = new (Backbone.View.extend({
		initialize: function() {
			this.collection.on("all", this.render, this);

			this.meta = this.$(".ds-canvas-metalayer");
			this.content = this.$(".ds-canvas-contentlayer");
		},
		render: function() {
			var container = this.meta, guideElements = container.find(".ds-canvas-guide"), guideEl;
			this.collection.each(function (guide) {
				guideEl = guideElements.filter("#" + guide.get("id"));
				if (!guideEl.length) {
					// Has yet to be created
					guideEl = $("<div class='ds-canvas-guide' id='" + guide.get("id") + "' />").appendTo(container);
				}

				if (guide.get("axis") === "y") {
					guideEl.addClass("ds-canvas-guide-horizontal").css({
						top: guide.get("position") + "px"
					})
				} else {
					guideEl.addClass("ds-canvas-guide-vertical").css({
						left: guide.get("position") + "px"
					})
				}
			});
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

	var dsItemView = new (Backbone.View.extend({
			initialize: function() {
				this.collection.on("add remove", this.render, this);

				this.collection.on("change:selected", this.select, this);
	
				this.meta = this.$(".ds-canvas-metalayer");
				this.content = this.$(".ds-canvas-contentlayer");

				this.cache = {};

				var handles = "";
				_.each("nw n ne e se s sw w".split(" "), function (dir) {
					handles += "<div class='ds-canvas-selectframe-handle ds-canvas-selectframe-handle-" + dir + "' data-direction='" + dir + "'></div>";
				});
				this.selectFrame = $("<div class='ds-canvas-selectframe'>" + handles + "</div>");
			},
			render: function() {
				var container = this.content, items = container.find(".ds-canvas-item");
				this.collection.each(function (item) {
					itemEl = items.filter("#" + item.get("itemId"));
					if (!itemEl.length) {
						// Has yet to be created
						itemEl = $("<div class='ds-canvas-item' id='" + item.get("itemId") + "'><img src='test.jpg' style='width:100%;height:100%' /></div>").appendTo(container);
					}
	
					itemEl.css({
						width: item.width,
						height: item.height,
						left: item.x,
						top: item.y,
						webkitTransform: "rotate(" + item.rotation + "deg)"
					});
				});
			},
			select: function (item, select) {
				var itemEl = this.content.find("#" + item.get("itemId"));
				itemEl.toggleClass("ds-canvas-item-selected", select);
				if (select) {
					this.meta.append(this.selectFrame.clone().css({
						top: item.y,
						left: item.x,
						width: item.width,
						height: item.height,
						webkitTransform: "rotate(" + item.rotation + "deg)"
					}).attr("data-itemId", item.get("itemId")));
				} else {
					this.meta.find(".ds-canvas-selectframe[data-itemId=" + item.get("itemId") + "]").remove();
				}
			},
			move: function (e) {
				if(e.dsType === "selectframe") {
					var dsType = e.dsType,
						targets = e.$target.add(e.dsObject.$itemEl),
						item = e.dsObject.item;

					if (e.type === "dragstart") {
						this.positionInTarget = e.getPositionInTarget();
					}
					var x = e.pageX - this.positionInTarget.x,
						y = e.pageY - this.positionInTarget.y,
						snap, snapX, snapY;

					snap = SnapManager.snapRectangle(x, y, item.width, item.height);

					targets.css(snap.cssPosition);

					if (e.type === "dragend") {
						item.set({
							x: snapX,
							y: snapY
						});
					}
				}
			},
			resize: function (e) {
				if (e.dsType === "selectframe-handle") {
					var data = e.dsObject, item = data.item, movingHandle = {
						x: e.pageX,
						y: e.pageY
					}, fixedHandle = {}, snapData,
					x, y, width, height,
					scaleX, scaleY, transformOrigin = "";

					// Correct movingHandle coordinates in case of single-axis transformation
					if (data.direction === "n" || data.direction === "s") {
						movingHandle.x = item.x + item.width;
					} else if (data.direction === "e" || data.direction === "w") {
						movingHandle.y = item.y + item.height;
					}

					if (e.type === "dragstart") {
						data.$itemEl.css("webkitTransformOrigin", "0 0");
						// x-Axis
						if (data.direction === "n" || data.direction === "s" || data.direction.indexOf("e") > -1) {
							fixedHandle.x = item.x;
							transformOrigin = "0 ";
						} else if (data.direction.indexOf("w") > -1) {
							fixedHandle.x = item.endX;
							transformOrigin = "100% ";
						}

						// y-Axis
						if (data.direction.indexOf("n") > -1) {
							fixedHandle.y = item.endY;
							transformOrigin += "100%";
						} else if (data.direction === "w" || data.direction === "e" || data.direction.indexOf("s") > -1) {
							fixedHandle.y = item.y;
							transformOrigin += "0";
						}
						this.cache.fixedHandle = fixedHandle;
						this.cache.transformOrigin = transformOrigin;
					} else {
						fixedHandle = this.cache.fixedHandle;
						transformOrigin = this.cache.transformOrigin;
					}

					width = Math.abs(movingHandle.x - fixedHandle.x);
					height = Math.abs(movingHandle.y - fixedHandle.y);

					x = Math.min(movingHandle.x, fixedHandle.x);
					y = Math.min(movingHandle.y, fixedHandle.y);

					snapData = SnapManager.snapRectangle(x,y,width,height);

					scaleX = snapData.width / item.width;
					scaleY = snapData.height / item.height;

					e.$target.parent().css(_.extend({}, snapData.cssDimension, snapData.cssPosition));

					if (e.type !== "dragend") {
						data.$itemEl.css(_.extend({
							"webkitTransform": "rotate(" + item.rotation + "deg) scaleX(" + scaleX + ") scaleY(" + scaleY + ")",
						}, snapData.cssPosition));
					} else {
						data.$itemEl.css(_.extend({
							webkitTransform: "rotate(" + item.rotation + "deg)"
						}, snapData.cssPosition, snapData.cssDimension));
						data.item.set(_.extend({
							x: snapData.x,
							y: snapData.y
						}, snapData.cssDimension));
					}
				}
			},
			events: {
				"dragstart .ds-canvas-selectframe": "move",
				"drag .ds-canvas-selectframe": "move",
				"dragend .ds-canvas-selectframe": "move",
				"dragstart .ds-canvas-selectframe-handle": "resize",
				"drag .ds-canvas-selectframe-handle": "resize",
				"dragend .ds-canvas-selectframe-handle": "resize"
			}
	}))({
		collection: itemList,
		el: $(".ds-canvas")
	});

	var SelectManager = new (Backbone.View.extend({
		initialize: function () {
				this.meta = this.$(".ds-canvas-metalayer");
				this.content = this.$(".ds-canvas-contentlayer");
			this.multipleSelectFrame = $("<div class='ds-canvas-multipleselect' />").appendTo(this.meta);
		},
		toggleSelect: function (e) {
			if (e.dsType !== "selectframe" && e.dsType !== "selectframe-handle") {
				_.each(this.collection.where({"selected": true}), function (item) {
					item.set("selected", false);
				});
			}
			if (e.dsType === "item") {
				var item = e.dsObject;
				item.set("selected", !item.get("selected"));
			}
		},
		drawSelection: function (e) {
			if (e.dsType === "none") {
				console.log("drawSelection")
				switch (e.type) {
					case "dragstart": 
					console.log("startselect")
					this.startPoint = {
						x: e.pageX,
						y: e.pageY
					};
					this.multipleSelectFrame.show();
					break;
					case "drag":
					var startX, startY, endX, endY, width, height;
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
					})
					break;
					case "dragend": 
					this.multipleSelectFrame.removeAttr("style").hide();
					break;
				}

			}
		},
		events: {
			"mousedown": "toggleSelect",
			"dragstart": "drawSelection",
			"drag": "drawSelection",
			"dragend": "drawSelection"
		}
	}))({
		collection: itemList,
		el: $(".ds-canvas")
	});



	_.extend(dsCanvas, {
		addGuide: function (axis, position) {
			guideList.add({axis: axis, position: position});
		},

		addItem: function (attr) {
			itemList.add(attr);
		},
		page: page,
		guideList: guideList
	});

	win.ds = win.ds || {};
	win.ds.canvas = dsCanvas;
})(window);

ds.canvas.addGuide("x", 300);
ds.canvas.addGuide("y", 200);

ds.canvas.addItem({
	width: 100,
	height: 150,
	x: 300,
	y: 400
});
ds.canvas.addItem({
	width: 200,
	height:100,
	x: 350,
	y:350
})