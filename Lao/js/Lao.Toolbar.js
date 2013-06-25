(function (win, doc, Backbone, _, $, Lao) {

	var ToolbarButton = Lao.extend("ListItem", {
		"template": "<li><div class=\"LaoToolbarItemIcon\"><% if (typeof icon != 'undefined') { %><div class=\"LaoIcon\"></div><% } %></div><% if (typeof menu === 'object' && menu.length) { %><div class=\"LaoToolbarMenuIndicator LaoCaretDown LaoSmall\"></div><% } %><span class=\"LaoToolbarItemName\"><%= (typeof name === 'string' ? name : \"\") %></span></li>",
		className: "LaoToolbarItem",
		initialize: function () {
			if (this.model) {
				if (this.model.get("icon")) {
					this.$(".LaoIcon").css(this.model.get("icon").getStyleDeclaration());
				}

				if (this.hasMenu = !!this.model.get("menu")) {
					this.menu = Lao.create("Contextmenu", {
						"menu": this.model.get("menu")
					})
				}

				this.model.on("change", this.render, this);
			}
		},
		render: function () {
			this.setElement(this.template(this.model.toJSON()));
			if (this.model.get("icon")) {
				this.$(".LaoIcon").css(this.model.get("icon").getStyleDeclaration());
			}
		},
		openMenu: function () {
			if (this.hasMenu) {
				this.menu.open(this[0]);
				this.menu
				.once("close", this.deactivate, this)
				.once("choose", this.chooseOption, this);
			}
		},
		chooseOption: function (option) {
		},
		closeMenu: function () {
			if (this.hasMenu) {
				this.menu.close();
				this.menu.off("all", this.chooseOption, this);
			}
		},
		activate: function (e) {
			this.addClass("LaoActive");
			this.openMenu()
		},
		deactivate: function (e) {
			this.removeClass("LaoActive");
			this.closeMenu();
		},
		events: {
			"mousedown": "activate",
			"mouseup": "deactivate"
		}
	}),
	Toolbar = Lao.extend("List", {
		template: "<div><ul class=\"LaoList\"><!-- Lao:Appendpoint --></ul></div>",
		listItem: ToolbarButton,
		className: "LaoToolbar"
	});

	Lao.define({
		"ToolbarButton": ToolbarButton,
		"Toolbar": Toolbar
	})

})(window, document, Backbone, _, jQuery, Lao);