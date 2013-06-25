(function (win, doc, Backbone, _, $, Lao) {

	var DragStates = {
		"START": "start",
		"DRAG": "drag",
		"END": "end"
	}

	var ManageableList = Lao.extend("List", {
		moveItem: function (dragState, e) {
			switch (dragState) {
				case DragStates.START:
				break;
				case DragStates.DRAG:
				break;
				case DragStates.END:
				break;
			}
		},
		detectDrag: function (e) {
			if (e.type === "mousedown") {
				return this.isMouseDown = true;
			}
			if (this.isMouseDown) {
				if (!this.isDrag) {
					this.isDrag = true;
					this.moveItem(DragStates.START, e);
				} else if (e.type === "mouseup") {
					this.isMouseDown = false;
					this.isDrag = false;
					this.moveItem(DragStates.END, e);
				} else {
					this.moveItem(DragStates.DRAG, e);
				}
			}
		},
		additionalEvents: {
			"mousemove li": "detectDrag",
			"mousedown": "detectDrag",
			"mouseup": "detectDrag"
		}
	});

	Lao.define("ManageableList", ManageableList)

})(window, window.document, window.Backbone, window._, window.jQuery, window.Lao);