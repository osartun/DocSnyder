(function (win, doc, $, _, Backbone, root) {

	var idPrefix = classPrefix = "ds-text-toolbar-";

	function create(tagname) {
		return doc.createElement(tagname || "div");
	}

	function generateOption (value, name) {
		var option = create("option");
		option.value = value;
		if ("innerText" in option) {
			option.innerText = name;
		} else if ("textContent" in option) {
			option.textContent = name;
		}
		return option;
	}

	function generateSelect (data) {
		var select = $(create("select")).addClass(classPrefix + "select"), i = 0, l = data.length;
		for (; i < l; i++) {
			select.append(generateOption(data[i][0], data[i][1]));
		}
		return select[0];
	}

	function generateSelectmenu (menu) {
		var 
		menuData = [[menu.header, menu.header]].concat(_.pairs(menu.values)),
		select = generateSelect(menuData);
		select.id = idPrefix + menu.command;
		return select;
	}

	function generateMenus (menus) {
		for (var i = 0, res = [], l = menus.length; i < l; i++) {
			res[i] = generateSelectmenu(menus[i]);
		}
		return res;
	}

	function generateButton (button, spriteURI) {
		var b = create("button"),
		div = $(create()).appendTo(b);

		div.css("backgroundPosition", button.coords);

		b.title = button.title;
		b.id = idPrefix + button.command;
		b.className = classPrefix + "button";
		return b;
	}

	function generateButtons (buttons, spriteURI) {
		for (var i = 0, res = [], l = buttons.length; i < l; i++) {
			res[i] = generateButton(buttons[i], spriteURI);
		}
		return res;
	}

	var getId = (function (id) {
		return function () {
			return id++;
		}
	})(0);

	var toolbarData = {
		menus: [
			{
				"command": "fontname",
				"header": "Schriftart",
				"values": {
					"Arial": "Arial",
					"Arial Black": "Arial Black",
					"Courier New": "Courier New",
					"Times New Roman": "Times New Roman"
				}
			}, {
				"command": "fontsize",
				"header": "Schriftgröße",
				"values": {
					"1": "Sehr klein",
					"2": "Klein",
					"3": "Normal",
					"4": "Medium",
					"5": "Groß",
					"6": "Sehr groß",
					"7": "Maximal"
				}
			}
		],
		buttons: [
			{
				"command": "bold",
				"title": "Fett",
				"coords": "0 0"
			}, {
				"command": "italic",
				"title": "Kursiv",
				"coords": "-22px 0"
			}, {
				"command": "underline",
				"title": "Unterstrichen",
				"coords": "-44px 0"
			}, {
				"command": "justifyleft",
				"title": "Linksbündig",
				"coords": "-66px 0"
			}, {
				"command": "justifycenter",
				"title": "Zentriert",
				"coords": "-88px 0"
			}, {
				"command": "justifyright",
				"title": "Rechtsbündig",
				"coords": "-110px 0"
			}, 
		]
	}

	var TextToolbar = root.Toolbar.extend({
		initialize: function (attr) {
			this.$el.append(generateMenus(toolbarData.menus))
			.append(generateButtons(toolbarData.buttons, attr ? attr.spriteURI : ""));
		},
		changeFormatting: function (command, value) {
			this.options.tool.format(command, value);
		},
		selectChangeHandler: function (e) {
			var 
			target = e.target,
			selectedIndex = target.selectedIndex,
			command = target.id.substr(idPrefix.length);
			if (selectedIndex > 0) {
				this.changeFormatting(command, target[selectedIndex].value);
				target.selectedIndex = 0;
			}
		},
		buttonClickHandler: function (e) {
			var button = e.target.tagName === "BUTTON" ? e.target : e.target.parentNode,
			command = button.id.substr(idPrefix.length);
			this.changeFormatting(command, false);
		},
		events: {
			"change": "selectChangeHandler",
			"click button": "buttonClickHandler"
		}
	})

	root.ToolbarManager.define("Text", TextToolbar)

})(window, document, jQuery, _, Backbone, window.ds);