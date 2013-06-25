(function (Backbone, root) {

	var changingItem, prevAttrs, uistate;

	Backbone.UndoManager.changeUndoType("change", {
		"on": function (model, options) {
			if (model.get && model.get("content") && model.get("content").getModel) {
				// This seems to be an Item
				uistate = model.get("content").getModel().get("uistate");
				if (uistate === "resize" && !changingItem) {
					changingItem = model;
					prevAttrs = model.previousAttributes();
				} else if (uistate !== "resize" && changingItem === model) {
					changingItem = false;
					return {
						object: model,
						before: prevAttrs,
						after: _.pick(model.attributes, _.keys(prevAttrs))
					}
				}
			} else {
				var
				changedAttributes = model.changedAttributes(),
				previousAttributes = _.pick(model.previousAttributes(), _.keys(changedAttributes));
				return {
					object: model,
					before: previousAttributes,
					after: changedAttributes
				}
			}
		}
	})
	root.supply({"UndoManager": new Backbone.UndoManager});
})(window.Backbone, window.ds);