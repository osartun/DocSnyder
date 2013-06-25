(function (win, doc, $, _, Backbone, root) {

	var 
	Toolbar = Backbone.View,
	ToolbarManager = Backbone.View.extend({
		className: "ds-toolbar",
		initialize: function (attr) {
			this.toolbars = {};
			this.createdToolbars = {};
			if (attr && attr.toolmanager) {
				var currentTool = attr.toolmanager
				.on("change:currentTool", function (m, tool) {
					this.setToolbar(tool);
				}, this)
				.get("currentTool");

				this.setToolbar(currentTool);
			}
		},
		define: function (name, toolbar) {
			// The name must be equal to the tool's name
			if (toolbar && (new toolbar) instanceof Toolbar && 
				this.options.toolmanager && this.options.toolmanager.isDefined(name) &&
				!this.isDefined(name)) {
				this.toolbars[name] = toolbar;
			}
			return this;
		},
		create: function (toolname, attr) {
			if (this.isDefined(toolname)) {
				var toolbar = this.getToolbar(toolname);
				(attr || (attr = {})).tool = this.options.toolmanager.get(toolname);
				return new toolbar(attr);
			}
		},
		isDefined: function (toolname) {
			return toolname in this.toolbars;
		},
		isCreated: function (toolname) {
			return toolname in this.createdToolbars;
		},
		getToolbar: function (toolname) {
			return this.toolbars[toolname];
		},
		getCreatedToolbar: function (toolname) {
			return this.createdToolbars[toolname];
		},
		activate: function (toolbars, allAttrs) {
			if ($.isPlainObject(toolbars) && !allAttrs) {
				allAttrs = toolbars;
				toolbars = false;
			}
			if (toolbars && !_.isArray(toolbars)) {
				toolbars = [toolbars];
			} else if (!toolbars) {
				toolbars = _.keys(this.toolbars);
			}
			if (!allAttrs) {
				allAttrs = {};
			}
			var name;
			while (name = toolbars.pop()) {
				if (!(name in this.createdToolbars)) {
					this.createdToolbars[name] = this.create(name, allAttrs[name]);
				}
			}
			return this;
		},
		setToolbar: function (toolname) {
				console.log("hier", toolname)
			if (this.isCreated(toolname)) {
				this.$el.empty().append(this.getCreatedToolbar(toolname).el);
			}
			return this;
		}
	});

	root.supply({
		"Toolbar": Toolbar,
		"ToolbarManager": new ToolbarManager({
			toolmanager: root.ToolManager
		})
	})

})(window, document, jQuery, _, Backbone, window.ds);