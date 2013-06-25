(function (win, doc, $, _, Backbone, root) {

	var TextTool = root.Tool.extend({
		initialize: function () {
			this
			.on("activate", this.requestFocus, this)
			.on("deactivate", this.loseFocus, this);
		},
		cursor: "text",
		setContent: function () {
			var textItem = this.getModel().get("content");
			textItem.set("content", $(doc.activeElement).html())
		},
		format: function (command, value) {
			doc.execCommand(command, false, value || false);
			this.setContent();
		},
		attributesToForward: ["clientX", "clientY", "pageX", "pageY", "shiftKey", "altKey", "metaKey"],
		forwardEvent: function (e) {
			if (this.isActive && e.dsObject.itemEl) {
				if (e.type.indexOf("drag") === 0) {
					if (e.type === "dragend") {
						e.type = "mouseup";
					} else {
						e.type = "mousemove";
					}
				}
				var 
				eventDoc = e.relatedTarget ? e.relatedTarget.ownerDocument : doc;
				eDoc = eventDoc.documentElement,
				body = eventDoc.body,
				pageX = e.clientX +
							( eDoc && eDoc.scrollLeft || body && body.scrollLeft || 0 ) -
							( eDoc && eDoc.clientLeft || body && body.clientLeft || 0 ),
				pageY = e.clientY +
							( eDoc && eDoc.scrollTop || body && body.scrollTop || 0 ) -
							( eDoc && eDoc.clientTop || body && body.clientTop || 0 ),
				eventData = _.extend(_.pick(e, this.attributesToForward), {
					target: e.dsObject.itemEl.firstElementChild,
					pageX: pageX,
					pageY: pageY
				});
				$(e.dsObject.itemEl.firstElementChild).simulate(e.type, eventData)
			}
		},
		events: {
			"mousedown": "forwardEvent",
			"mousemove": "forwardEvent",
			"mouseup": "forwardEvent",
			"click": "forwardEvent",
			"dragstart": "forwardEvent",
			"drag": "forwardEvent",
			"dragend": "forwardEvent"
		},
		shortcuts: {
			"meta+B": function () {
				this.format("bold");
			},
			"meta+I": function () {
				this.format("italic");
			},
			"meta+U": function () {
				this.format("underline");
			}
		}
	});

	root.ToolManager.define("Text", new TextTool({
		el: $(".ds-canvas")
	}), "Text")

})(window, document, jQuery, _, Backbone, window.ds);