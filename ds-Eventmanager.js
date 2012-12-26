(function (root, global, Backbone, _, $) {
	if (!root || !global || !Backbone || !_ || !$) return;

var Item = root.Item,
	itemList = root.itemList,
	Guide = root.Guide,
	guideList = root.guideList,
	page = root.page,
	dsItemView = root.ItemView,
	SelectManager, SelectManagerView, ItemView,
	EventDelegator;

/* EventDelegator */
EventDelegator = Backbone.View.extend({
	initialize: function () {
		this.cache = {
			validDSTypes: /none|guide|item|selectframe|selectframe-handle/, // TO DO: selctframe-foobar would also pass this test
			validClassNames: /ds-canvas-[guide|item|selectframe|contentlayer]/
		};
		this.meta = $(".ds-canvas-metalayer");
		this.content = $(".ds-canvas-contentlayer");
		this.containerOffset = this.$el.offset();
/*			page.on("change:scale", function (m, c) {
			this.scale = c.scale;
		}, this);*/
		this.isMouseDown = false;
		this.isDrag = false;

		SelectManager.on("select unselect", this.triggerEvent, this);
	},
	isValidDSObject: function (dsObject) {
		return dsObject instanceof Item || dsObject instanceof Guide;
	},
	isValidDSType: function (dsType) {
		return typeof dsType === "string" && this.cache.validDSTypes.test(dsType);
	},
	isValidDOMNode: function (domNode) {
		return domNode && domNode.nodeType && domNode.className && this.cache.validClassNames.test(domNode.className);
	},
	validateEvent: function (e) {
		e.isValid = !!(this.isValidDSType(e.dsType) 
						&& this.isValidDSObject(e.dsObject) 
						&& this.isValidDOMNode(e.target)
						&& e.$target instanceof $
						&& _.areNumbers(e.pageX, e.pageY)
						&& _.isFunction(e.getPositionInTarget));
		return e;
	},
	normalizeEvent: function (e, validate) {
		if (typeof e.type === "string" && this.isValidDSObject(e.dsObject) || (e.target && e.target.nodeType)) {
			e.dsType || (e.dsType = this.getDSTargetTypeByObject(e.dsObject));
			if (e.$target && !e.target) {
				e.target = e.$target.get(0);
			} else if (e.target && !e.$target) {
				e.$target = $(e.target);
			} else if (!e.target && !e.$target) {
				e.$target = this.getDOMTargetByObject(e.dsObject, e.dsType);
				e.target = e.$target.get(0)
			}
			e.dsObject || (e.dsObject = this.getDSTargetObjectByNode(e.dsType, e.target, e));
			e.dsObjectId || (e.dsType === "item" || e.dsType === "guide") && (e.dsObjectId = e.dsObject.get("id"))
			typeof e.pageX === "number" || (e.pageX = this.cache.pageX);
			typeof e.pageY === "number" || (e.pageY = this.cache.pageY);
			e.getPositionInTarget || (e.getPositionInTarget = (function () {
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
				var position, positionInTarget, pX = e.pageX, pY = e.pageY;
				return function() {
					return positionInTarget || ((position = e.$target.position())
						&& (positionInTarget = {
							x: pX - position.left,
							y: pY - position.top
						}));
				};
			})());
		}
		return validate ? this.validateEvent(e) : e;
	},
	triggerEvent: function (e, validate) {
		validate !== undefined || (validate = true);
		e = this.normalizeEvent(e, validate);
		if (!validate || e.isValid) {
			this.$el.trigger(new $.Event(e.type, e));
		}
	},
	normalizeDOMTarget: function (e) {
		var target = $(e.target), item, x = e.pageX, y = e.pageY;
		if (target.is(this.meta) || target.hasClass("ds-canvas-selectframe")) {
			// Click was pointed on no specific element on the metalayer (guides for example), 
			// but rather aimed at an element beneath it. So let's figure out which element 
			// was meant.
			!(item = page.getItemOfPoint(x,y)) // If there's no item, go on. Otherwise:
			|| (target = $(dsItemView.getItemById(item.get("id")) || [])); // Write the item's Node in
		}
		return target.get(-1);
	},
	getDOMTargetByObject: function (dsObject, dsType) {
		if (!dsObject) return;
		dsType || (dsType = this.getDSTargetTypeByObject(dsObject));
		if (dsType != "none") {
			var domNode;
			switch (dsType) {
				case "item": domNode = dsItemView.getItemById(dsObject.get("id")); break;
				case "guide": domNode = dsGuideView.getGuideById(dsObject.get("id")); break;
			}
			return domNode;
		}
	},
	getDSTargetTypeByNode: function (domNode, e) {
		if (domNode === undefined) return "none";
		var classList = domNode.classList, type = _.find("item guide selectframe-handle selectframe".split(" "), function (type) {
			return classList.contains("ds-canvas-" + type);
		});
		return type;
	},
	getDSTargetTypeByObject: function (dsObject, e) {
		var type = "none";
		if (dsObject instanceof Item) type = "item";
		if (dsObject instanceof Guide) type = "guide";
		return type;
	},
	getDSTargetObjectByNode: function (type, domNode, e) {
		if (domNode === undefined) return {};

		var object, id = domNode.id, $node, itemId, $item;
		switch (type) {
			case "item": object = itemList.getItemById(id); break;
			case "guide": object = guideList.getGuideById(id); break;
			case "selectframe":
			case "selectframe-handle": object = _.extend(($node = $(domNode)).data(), {
				dsObjectId: (itemId = ($node.hasClass("ds-canvas-selectframe-handle") ? $node.parent() : $node).data().itemid),
				$itemEl: ($item = this.content.find("#" + itemId)),
				itemEl: $item.get(0),
				dsObject: itemList.getItemById(itemId)
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
		if (e.isProcessed || e === this.cache.event || !e.target) return; // We have triggered this event, so don't process it another time

		e.preventDefault();
		e.stopImmediatePropagation();

		if (e.type === "click") return; // We detect clicks ourselves to distinguish them from drags

		var targetDOMElement = this.cache.domNode,
			targetType = this.cache.type,
			targetDSObject = this.cache.dsObject,
			pageX = this.getPageRelativeCoords("x", e.pageX),
			pageY = this.getPageRelativeCoords("y", e.pageY),
			eType = e.type, $target;
		this.cache.pageX = pageX;
		this.cache.pageY = pageY;

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

		if (eType.indexOf("drag") === 0) {
			// This is a drag (dragstart, drag or dragend)
			// Drags usually refer to their drag-target, so let's just access 
			// our cache instead of retrieving the target again
			this.cache.event = e;
		} else if (this.cache.target !== e.target || e.target.className.indexOf("ds-canvas-metalayer") > -1) {
			// If we had this target last time already, skip targetDetection and access our cache
			// Except if the target is the metalayer which means the actual target is underneath it
			targetDOMElement = this.normalizeDOMTarget(_.extend(e, {
				pageX: pageX,
				pageY: pageY
			}));
			if (!this.cache.type || this.cache.domNode !== targetDOMElement) { // Well, now we know it's really another target
				targetType = this.getDSTargetTypeByNode(targetDOMElement, e) || "none";
				targetDSObject = this.getDSTargetObjectByNode(targetType, targetDOMElement, e);
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

		this.triggerEvent({
			isProcessed: true,
			type: eType,
			pageX: pageX,
			pageY: pageY,
			target: targetDOMElement || null,
			$target: $target,
			dsObject: targetDSObject,
			dsType: targetType,
		}, false);
	},
	events: {
		"mousedown": "processEvent",
		"mousemove": "processEvent",
		"mouseup": "processEvent",
		"click": "processEvent"
	}
});

root.demand(["SelectManager", "SelectManagerView", "ItemView"], function() {
	SelectManager = root.SelectManager;
	SelectManagerView = root.SelectManagerView;
	ItemView = root.ItemView;

	root.supply({
		"EventDelegator": new EventDelegator({
			el: $(".ds-canvas")
		})
	})
});

})(ds, this, Backbone, _, jQuery);