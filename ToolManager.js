(function (win, doc, $, _, Backbone, root) {

	var Tool = Backbone.View.extend({
		isActive: false,
		activate: function () {
			this.delegateEvents();
			this.bindShortcuts();
			this.trigger("activate", this);
			this.isActive = true;
		},
		deactivate: function () {
			this.trigger("deactivate", this);
			this.unbindShortcuts();
			this.undelegateEvents();
			this.isActive = false;
		},
		requestFocus: function () {
			var selected = root.SelectManager.getSelectedItems(),
			elements = this.elements = _.map(selected, function (item) {
				return root.ItemView.getItemById(item).children()[0];
			});
			$(elements).focus();
		},
		loseFocus: function () {
			$(this.elements).blur();
		},
		bindShortcuts: function () {
			if (root.Shortcut && this.shortcuts) {
				if (!this._keybings) {
					this._keybings = root.Shortcut.generate(this.shortcuts, this);
				}
				root.Shortcut.on(this._keybings, this);
			}
		},
		unbindShortcuts: function () {
			if (root.Shortcut && this._keybings) {
				root.Shortcut.off(this._keybings);
			}
		},
		getModel: function () {
			return view.currentItem;
		}
	}),
	ToolManager = Backbone.Model.extend({
		defaults: {
			"defaulttool": "Default"
		},
		types: {
			"*": []
		},
		define: function (name, tool, types) {
			if (tool instanceof Tool && !this.isDefined(name)) {
				this.set(name, tool);

				if (!types) {
					types = ["*"];
				}
				if (!_.isArray(types)) {
					types = [types];
				}
				if (types.length > 1 && _.contains(types, "*")) {
					types = ["*"];
				}
				for (var i = 0, l = types.length, type; i < l; i++) {
					type = types[i].toLowerCase();
					(this.types[type] || (this.types[type] = [])).push(tool);
				}
			}
			return this;
		},
		getToolsForType: function (type) {
			if (typeof type === "string") {
				type = type.toLowerCase();
				return [].concat(type in this.types ? this.types[type] : [], this.types["*"]);
			}
			return [];
		},
		getToolForType: function (type) {
			return this.getToolsForType(type)[0];
		},
		isDefined: function (name) {
			return name in this.attributes;
		},
		getCurrentTool: function () {
			return this.get(this.get("currentTool"));
		},
		setTool: function (name) {
			if (name === "Default") {
				name = this.get("defaulttool");
			}
			if (this.isDefined(name)) {
				var cur = this.getCurrentTool();
				if (cur) {
					cur.deactivate();
				}

				this.set("currentTool", name);

				cur = this.getCurrentTool();
				cur.activate();
			}
		},
		setDefaultTool: function (name) {
			if (this.isDefined(name)) {
				this.set("defaulttool", name);
			}
			return this;
		},
		isDefaultActive: function () {
			return this.get("currentTool") === this.get("defaulttool");
		}
	}),
	ToolManagerView = Backbone.View.extend({
		initialize: function () {
			this.cursors = {};
			this.model.on("change", this.toolAdded, this);
		},
		rItemType: /ds-canvas-item-type-(.+)/,
		getItemType: function (itemEl) {
			var match = itemEl ? this.rItemType.exec(itemEl.className) : null;
			return match ? match[1] : "";
		},
		toolAdded: function (model, options) {
			var changed = model.changedAttributes(),
			previous = model.previousAttributes(), 
			intersection = _.pick(previous, _.keys(changed)),
			i, cursor;

			for (i in changed) {
				if (_.has(changed, i)) {
					if (i === "currentTool" || i === "defaulttool") {
						continue;
					} if (i in previous) {
						// The tool has changed

					} else if (changed[i].cursor) {
						// The tool was added
						cursor = this.cursors[i] = new CustomCursor(changed[i].cursor);
						cursor.setSelector(".ds-canvas-item-type-" + i);
					}
				}
			}
		},
		activateTool: function (e) {
			this.currentItem = e.dsObject.dsObject;
			this.model.setTool(this.getItemType(e.dsObject.itemEl));
		},
		deactivateTool: function (e) {
			if (!this.model.isDefaultActive()) {
				var itemType = this.getItemType(e.dsObject.itemEl);
				if (itemType !== this.model.get("currentTool")) {
					// clicked outside
					this.model.setTool("Default");
				}
			}
		},
		events: {
			"doubleclick": "activateTool",
			"click": "deactivateTool"
		}
	}), 
	model = new ToolManager,
	view = new ToolManagerView({
		model: model,
		el: $(".ds-canvas")
	});

	root.supply({
		"Tool": Tool,
		"ToolManager": model
	})
})(window, document, jQuery, _, Backbone, window.ds);