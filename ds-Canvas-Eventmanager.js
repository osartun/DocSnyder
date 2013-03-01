(function (root, global, Backbone, _, $) {
	if (!root || !global || !Backbone || !_ || !$) return;

var Item = root.Item,
	itemList = root.itemList,
	Guide = root.Guide,
	guideList = root.guideList,
	page = root.page,
	dsItemView = root.ItemView,
	ScrollManager = root.ScrollManager,
	ScaleManager = root.ScaleManager,
	PositionManager = root.PositionManager,
	SelectManager, SelectManagerView, ItemView,
	EventDelegator, EventNormalizer,
	EventFilter, EventFilterProto,
	el = $(".ds-canvas");

/**
 * Turns internal Events into DOMEvents so that they 
 * can be caught by Backbone.View's "events"-Object. 
 * For example the "select"-Event triggered by the 
 * SelectManager.
 */
var InternalEvents = new (Backbone.Model.extend({
	initialize: function () {
		this.seperator = / /;
	},
	_forwardEvent: function (data) {
		if (data && typeof data === "object" && data.type && data.dsObjectId || data.dsObject) {
			data.dsObjectId || (data.dsObjectId = data.dsObject.get("id"));
			EventFilter.triggerEvent(EventNormalizer.normalizeEvent(data));
		}
	},
	registerNewEvent: function (type, instance) {
		if (typeof type === "string" && instance instanceof Backbone.Model || instance instanceof Backbone.Collection) {
			instance.on(type, this._forwardEvent, this);
		}
	}
}));

/**
 * The MouseEventManager handles all the mouse events: 
 * mousedown, mousemove, mouseup, dragstart, drag, dragend, click.
 */
var MouseEventManager = new (Backbone.View.extend({
	initialize: function () {
		this.cache = {
			event: {},
			mousePosition: {}
		};
		this.meta = $(".ds-canvas-metalayer");
		this.content = $(".ds-canvas-contentlayer");
		this.containerOffset = this.$el.offset();

		this.isMouseDown = false;
		this.isDrag = false;
	},
	_normalizeType: function (type) {
		// detects drag and distinguishes it from click etc.
		if (type === "mousemove" && this.isMouseDown) {
			if (!this.isDrag) {
				this.isDrag = true;
				type = "dragstart"
			} else {
				type = "drag"
			}
		} else if (type === "mouseup") {
			if (this.isDrag) {
				this.isDrag = false;
				type = "dragend";
			} else {
				// The mouse is up, but it was no drag. So, it's a click
				type = "click";
			}
		}
		return type;
	},
	_detectTarget: function (e) {
		var target = e.target, $target = $(target), id,
			x = e.pageX, y = e.pageY,
			selectedItems, nrOfSelectedItems, isTargetSelected;
		if ($target.hasClass("ds-canvas-selectframe")) {
			// We're on an item-Element
			// Beneth the item-Element could be another item-Element
			// If this other item-Element is selected and the user wants to grab its handle
			// the item-Element at the top would retain its click.
			// So check if there are any items selected and if the selected Item lies
			// beneath the item at the top
			selectedItems = SelectManager.getSelectedItems();
			nrOfSelectedItems = selectedItems.length;
			isTargetSelected = $target.hasClass("ds-selected");
			if (isTargetSelected && nrOfSelectedItems > 1 || nrOfSelectedItems && !isTargetSelected) {
				// There is at least one item selected, which is not the target
				var underlyingElements = $.elementsFromPoint(x,y, this.meta), // Get all the elements from the current point
				    selectHandle = underlyingElements.filter(".ds-canvas-selectframe-handle");
				if (selectHandle.length) {
					return {
						"$target": selectHandle,
						"target": selectHandle[0],
						"dsType": "selectframe-handle"
					}
				}
			}
		}
		// There is either no item selected or the current target item is selected
		// Anyway we don't have to look for potential selectHandles lying beneath this item
		return {
			"target": target,
			"$target": $target
		}
	},
	setCurrentMousePosition: function (x,y, clientX, clientY) {
		this.cache.mousePosition = _.extend({
			originalPageX: x,
			originalPageY: y,
			clientX: clientX,
			clientY: clientY
		}, PositionManager.cursorToPagecoords(x,y));
	},
	getCurrentMousePosition: function () {
		return {
			pageX: this.cache.mousePosition.pageX,
			pageY: this.cache.mousePosition.pageY,
			clientX: this.cache.mousePosition.clientX,
			clientY: this.cache.mousePosition.clientY
		};
	},
	processEvent: function (e) {
		if (e.isProcessed) return;
		e.preventDefault();
		e.stopImmediatePropagation();

		if (e.type === "click") return; // We detect clicks ourselves

		var type = this._normalizeType(e.type),
			customEvent;

		if (type !== e.type) {
			EventFilter.triggerEvent(EventNormalizer.normalizeEvent(_.extend({}, e.originalEvent,
				this.getCurrentMousePosition(), this._detectTarget(e), true)));
		}

		if (type === "drag" || type === "dragstart" || type === "dragend") {
			customEvent =_.extend({}, this.cache.event, {
				"type": type
			}, this.getCurrentMousePosition())
		} else {
			customEvent = EventNormalizer.normalizeEvent(_.extend({
				type: type
			}, this.getCurrentMousePosition(), this._detectTarget(e)), true);
		}

		this.cache.event = customEvent;

		EventFilter.triggerEvent(customEvent);
	},
	processMousemove: function (e) {
		if (!e.isProcessed) {
			this.setCurrentMousePosition(e.pageX, e.pageY, e.clientX, e.clientY);
			this.processEvent(e);
		}
	},
	processMousedown: function (e) {
		if (!e.isProcessed) {
			this.isMouseDown = true;
			this.processEvent(e);
		}
	},
	processMouseup: function (e) {
		if (!e.isProcessed) {
			this.isMouseDown = false;
			this.processEvent(e);
		}
	},
	events: {
		"mousedown": "processMousedown",
		"mousemove": "processMousemove",
		"mouseup": "processMouseup",
		"click": "processEvent"
	}
}))({
	el: el
});

EventNormalizer = new (Backbone.Model.extend({
	initialize: function () {
		this.meta = $(".ds-canvas-metalayer");
		this.nones = $().add(this.meta).add(this.meta.find(".ds-canvas-page-wrapper, .ds-canvas-page"));
		this.content = $(".ds-canvas-contentlayer");
		this.cache = {
			validDSTypes: /none|guide|item|selectframe|selectframe-handle/, // TO DO: selctframe-foobar would also pass this test
			validClassNames: /ds-canvas-[guide|item|selectframe|contentlayer]/
		};
	},
	_getDOMTargetByObject: function (dsObject, dsType) {
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
	_getDSTargetTypeByNode: function (domNode, e) {
		if (domNode === undefined || this.nones.contains(domNode)) return "none";
		var classList = domNode.classList ? domNode.classList : domNode.className.split(" "), type = _.find("viewport item guide selectframe-handle selectframe".split(" "), function (type) {
			return classList.contains ? classList.contains("ds-canvas-" + type) : _.contains(classList, "ds-canvas-" + type);
		});
		return type;
	},
	_getDSTargetTypeByObject: function (dsObject, e) {
		var type = "none";
		if (dsObject instanceof Item) type = "item";
		if (dsObject instanceof Guide) type = "guide";
		return type;
	},
	_getDSTargetObjectByNode: function (type, domNode, e) {
		if (domNode === undefined) return {};

		var object, id = domNode.id, $node, itemId, $item;
		switch (type) {
			case "viewport": object = null; break;
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
	_isValidDSObject: function (dsObject) {
		return dsObject instanceof Item || dsObject instanceof Guide;
	},
	_isValidDSType: function (dsType) {
		return typeof dsType === "string" && this.cache.validDSTypes.test(dsType);
	},
	_isValidDOMNode: function (domNode) {
		return domNode && domNode.nodeType && domNode.className && this.cache.validClassNames.test(domNode.className);
	},
	validateEvent: function (e) {
		e.isValid = !!(this._isValidDSType(e.dsType) 
						&& this._isValidDSObject(e.dsObject) 
						&& this._isValidDOMNode(e.target)
						&& e.$target instanceof $
						&& _.areNumbers(e.pageX, e.pageY)
						&& _.isFunction(e.getPositionInTarget));
		return e;
	},
	normalizeEvent: function (e, validate) {
		if (e && typeof e.type === "string" && this._isValidDSObject(e.dsObject) || (e.target && e.target.nodeType)) {
			if (!e.dsType) {
				if (e.dsObject) {
					e.dsType = this._getDSTargetTypeByObject(e.dsObject);
				} else {
					e.dsType = this._getDSTargetTypeByNode(e.target);
				}
			}
			if (e.$target && !e.target) {
				e.target = e.$target.get(0);
			} else if (e.target && !e.$target) {
				e.$target = $(e.target);
			} else if (!e.target && !e.$target) {
				e.$target = this._getDOMTargetByObject(e.dsObject, e.dsType);
				e.target = e.$target.get(0);
			}
			e.dsObject || (e.dsObject = this._getDSTargetObjectByNode(e.dsType, e.target, e));
			e.dsObjectId || (e.dsType === "item" || e.dsType === "guide") && (e.dsObjectId = e.dsObject.get("id"));
			typeof e.pageX === "number" || (e.pageX = MouseEventManager.getCurrentMousePosition().pageX);
			typeof e.pageY === "number" || (e.pageY = MouseEventManager.getCurrentMousePosition().pageY);
			typeof e.clientX === "number" || (e.clientX = MouseEventManager.getCurrentMousePosition().clientX);
			typeof e.clientY === "number" || (e.clientY = MouseEventManager.getCurrentMousePosition().clientY);
			e.getPositionInTarget || (e.getPositionInTarget = (function (m, $target, e) {
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
				var s, position, positionInTarget;
				return function() {
					if (positionInTarget === undefined) {
						s = {left: parseFloat($target.css("left")), top: parseFloat($target.css("top"))};
						positionInTarget = {
							x: e.pageX - s.left,
							y: e.pageY - s.top
						};
					}
					return positionInTarget;
				};
			})(MouseEventManager.cache.mousePosition, e.$target, e));
/*			e.getSnapPosition || (e.getSnapPosition = (function (pX, pY, uX, uY) {

			})(e.pageX, e.pageY, e.unscaledPageX, e.unscaledPageY));*/
		}
		return validate ? this.validateEvent(e) : e;
	},
}))({
	el: el
});


/**
 * Contrary to an Array the Eventqueue has extended functionality 
 * in that it makes sure that only one event of a type is in the 
 * queue — just like an object, but contrary to an object it keeps
 * the order of its contents.
 */
function Eventqueue() {
	this.eventTypes = {}; // eventtype: index of event in queue
	this.events = []; // Eventqueue
}
Eventqueue.prototype = {
	unshift: function (e) {
		var i;
		if ((i = this.eventTypes[e.type]) !== undefined && i > -1) {
			// This type of event is already in the event queue
			this.events.splice(i, 1); // delete it
		}
		// Add the new Event to the beginning of the queue
		this.events.unshift(e);
		this.length = this.events.length;
		_.each(this.events, function (e, i) {
			this.eventTypes[e.type] = i;
		}, this);
	},
	flush: function (iterator, context) {
		var d;
		while ((d = this.events.pop())) {
			iterator.call(context || null, d);
		}
		this.eventTypes = {};
		this.length = this.events.length;
	},
	toString: function () {
		var s = [], i = 0, l = this.length;
		for (; i<l; i++) s.push(this.events[i].type);
		return "[" + s.join(",") + "]";
	}
};

/*
 * EventFilter
 * The Eventfilter caches triggered Events and triggers them with the next animation frame.
 */
EventFilterProto = Backbone.View.extend({
	initialize: function () {
		this.eventQueue = new Eventqueue();
		this.isAnimationFrameRequested = false;
		this._triggerEvent = _.bind(this._triggerEvent, this);
	},
	_triggerEvent: function (e) {
		if (e && typeof e === "object") {
			this.$el.trigger(new $.Event(e.type, e));
		} else {
			this.isAnimationFrameRequested = false; // reset
			this.eventQueue.flush(this._triggerEvent, this);
		}
	},
	triggerEvent: function (e, immediately) {
		e.isProcessed || (e.isProcessed = true);
		if (immediately) {
			this._triggerEvent(e);
		} else {
			this.eventQueue.unshift(e);
			if (!this.isAnimationFrameRequested) {
				window.requestAnimationFrame($.proxy(this._triggerEvent, this));
				this.isAnimationFrameRequested = true;
			}
		}
	}
});

root.demand(["SelectManager", "SelectManagerView", "ItemView"], function() {
	SelectManager = root.SelectManager;
	SelectManagerView = root.SelectManagerView;
	ItemView = root.ItemView;

	EventFilter = new EventFilterProto({
			el: el
		});

	InternalEvents.registerNewEvent("select unselect", SelectManager);

	/*SelectManager.on("select", function (e) {
		_(e).each(function (i,a) {
			console.log(i,a)
		})
	});*/

	root.supply({
		"EventDelegator": EventFilter
	})
});

})(ds, this, Backbone, _, jQuery);