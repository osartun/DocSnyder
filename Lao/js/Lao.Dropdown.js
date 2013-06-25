(function (win, doc, Backbone, _, $, Lao) {

	var BackboneView = Backbone.View.prototype,
	eventSpawner = new Backbone.Model,
	DropdownItem = Lao.extend("ListItem", {
		template: "<li><div class=\"LaoDropdownItemIcon\"><% if (typeof icon != 'undefined') { %><div class=\"LaoIcon\"></div><% } %></div><span class=\"LaoDropdownItemName\"><%= (typeof name === 'string' ? name : \"\") %><% if (typeof menu === 'object' && menu.length) { %><div class=\"LaoDropdownSubmenuIndicator LaoCaretRight\"><% } %></div></span></li>",
		className: "LaoDropdownItem",
		initialize: function (attr) {
			if (this.model) {
				if (this.model.get("icon")) {
					this.$(".LaoIcon").css(this.model.get("icon").getStyleDeclaration());
				}

				if (this.hasSubmenu = !!this.model.get("menu")) {
					this.submenu = new DropdownMenu({
						collection: this.model.get("menu")
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
		select: function () {
			this.addClass("isSelected");
			if (this.submenu) {
				if (this.parentMenu && this.parentMenu.parentContainer) {
					this.submenu.setParent(this.parentMenu.parentContainer)
				}
				this.submenu.open(this[0], this.expandDirection);
			}
		},
		unselect: function () {
			this.removeClass("isSelected");
			if (this.submenu) {
				this.submenu.close();
			}
		},
		getParentMenu: function () {
			return this.parentMenu;
		},
		chooseOption: function () {
			var callback = this.model.get("callback"), ret;
			if (_.isFunction(callback)) {
				ret = callback();
			}
			ret = ret !== false;
			if (ret) {
				eventSpawner.trigger("choose", this.model);
			}
			return ret;
		}
	}),

	DropdownMenu = Lao.extend("List", {
		template: "<div><div class=\"LaoDropdownUp\"><div class=\"LaoCaretUp\"></div></div><div class=\"LaoDropdownWrapper\"><ul class=\"LaoList\"><!-- Lao:Appendpoint --></ul></div><div class=\"LaoDropdownDown\"><div class=\"LaoCaretDown\"></div></div></div>",
		className: "LaoDropdownMenu",
		listItem: DropdownItem,
		isOpen: false,
		isClipped: false,
		selectedItem: undefined,
		expandDirection: "right",
		initialize: function () {
			this.wrapper = this.children(".LaoDropdownWrapper");
			this.ul = this.wrapper.children().first();

			if ("onmousewheel" in window || "onwheel" in window) {
				this.events["onmousewheel" in window ? "mousewheel" : "wheel"] = "scroll";
				this.delegateEvents();
			}
		},
		open: function (x, y, alternative) {
			if (!this.isOpen) {
				this.delegateEvents();

				// Set the reference to this object in the children's views
				this.ul.children().each(_.bind(function (i, el) {
					$(el).getLao().parentMenu = this;
				}, this));

				if (!this[0].offsetParent && this.parentContainer) {
					this.appendTo(this.parentContainer);
				}

				var height = this.height() + parseInt(this.css("paddingTop")) + parseInt(this.css("paddingBottom")),
					width = this.width(),
					$win = $(win),
					$body = $(doc.body),
					scrollTop = $win.scrollTop(),
					scrollLeft = $win.scrollLeft(),
					winHeight = $win.height(),
					winWidth = $win.width(),
					expandDirection,
					arrowHeight;

				if (y === "left" || y === "right") {
					expandDirection = y;
					y = undefined;
				} else {
					expandDirection = this.expandDirection;
				}

				if (typeof x === "object" && x.nodeName) {
					// Default is to the right of the element with expansion to the bottom
					var $el = $(x), offset = $el.offset(), elWidth = $el.width();
					y = offset.top - scrollTop;
					x = offset.left - scrollLeft + elWidth;
					// Alternative is to the left of the element with expansion to the top
					alternative = {
						x: x - width - elWidth,
						y: y + height
					}
					if (expandDirection === "left") {
						x = alternative.x;
						y = alternative.y;
						alternative = {
							x: offset.top - scrollTop,
							y: offset.left - scrollLeft + elWidth
						}
					}
				} else if (!alternative) {
					alternative = {
						x: winWidth - width,
						y: winHeight - height
					};
				}

				if (isNaN(x)) {
					x = ( (winWidth - width) / 2 )|0;
				}
				if (isNaN(y)) {
					y = ( (winHeight - height) / 2 )|0;
				}

				var protrusion = (y + height) - winHeight,
					mustBeClipped = height > winHeight,
					relocate, adjustedHeight, adjustedWidth, arrowAppendix;
				if (protrusion > 0) {
					y = height < winHeight ? y - protrusion : 0;
				}

				// If the Element is too far to the right
				if (x + width > winWidth) {
					expandDirection = this.expandDirection = "left";
					if (alternative && alternative.x && alternative.x + width <= winWidth) {
						x = alternative.x;
					} else {
						this.css("width", winWidth - x);
					}
				} else {
					expandDirection = this.expandDirection = "right";
				}

				this.css({
					"top": y,
					"left": x
				})

				if (mustBeClipped) {
					this.isClipped = true;
					this.addClass("LaoDropdownExpandDown");
					arrowAppendix = this.$(".LaoDropdownDown");
					arrowHeight = arrowAppendix.height() + parseInt(arrowAppendix.css("paddingTop")) + parseInt(arrowAppendix.css("paddingBottom"));
					adjustedHeight = winHeight - parseInt(this.css("paddingTop")) - parseInt(this.css("paddingBottom"));
					this.css("height", adjustedHeight)
					this.wrapper.css("height", adjustedHeight - arrowHeight);
					this.clippingData = {
						arrowHeight: arrowHeight,
						scrollTop: 0,
						containerHeight: adjustedHeight - arrowHeight,
						height: height,
						maxScrollTop: height - (adjustedHeight - arrowHeight)
					};
				}
				eventSpawner.trigger("open", this);
				this.isOpen = true;
			}
		},
		close: function () {
			if (this.isOpen) {
				this.unselect();
				this.removeAttr("style").removeClass("LaoDropdownExpandDown LaoDropdownExpandUp").detach();
				this.undelegateEvents();
				eventSpawner.trigger("close", this);
				this.isOpen = false;
			}
		},
		move: function (delta) {
			if (this.isClipped && typeof delta === "number") {
				var clippingData = this.clippingData, scrollTop = this.wrapper.scrollTop(), 
					prev = scrollTop,
					arrowAppendix, arrowHeight;
				if (delta < 0 && scrollTop < clippingData.height || delta > 0 && scrollTop > 0) {
					this.wrapper.scrollTop(scrollTop - delta);
					this.clippingData.scrollTop = scrollTop = this.wrapper.scrollTop();

					if (scrollTop === 0 && prev > 0) {
						// We've reached the top
						arrowAppendix = this.$(".LaoDropdownUp");
						arrowHeight = arrowAppendix.height() + parseInt(arrowAppendix.css("paddingTop")) + parseInt(arrowAppendix.css("paddingBottom"));
						this.removeClass("LaoDropdownExpandUp");
						clippingData.containerHeight += arrowHeight;
						this.wrapper.css("height", clippingData.containerHeight);
					} else if (prev === 0 && scrollTop > 0) {
						// We're leaving the top
						this.addClass("LaoDropdownExpandUp");
						arrowAppendix = this.$(".LaoDropdownUp");
						arrowHeight = arrowAppendix.height() + parseInt(arrowAppendix.css("paddingTop")) + parseInt(arrowAppendix.css("paddingBottom"));
						clippingData.containerHeight -= arrowHeight;
						this.wrapper.css("height", clippingData.containerHeight);
					}
					if (scrollTop === prev && scrollTop > 0 && !clippingData.isAtTheEnd) {
						// We've reached the end
						clippingData.isAtTheEnd = true;
						arrowAppendix = this.$(".LaoDropdownDown");
						arrowHeight = arrowAppendix.height() + parseInt(arrowAppendix.css("paddingTop")) + parseInt(arrowAppendix.css("paddingBottom"));
						this.removeClass("LaoDropdownExpandDown");
						clippingData.containerHeight += arrowHeight;
						this.wrapper.css("height", clippingData.containerHeight).scrollTop(scrollTop + arrowHeight)
					} else if (clippingData.isAtTheEnd && scrollTop < prev) {
						// We're leaving the end
						delete clippingData.isAtTheEnd;
						this.addClass("LaoDropdownExpandDown");
						arrowAppendix = this.$(".LaoDropdownDown");
						arrowHeight = arrowAppendix.height() + parseInt(arrowAppendix.css("paddingTop")) + parseInt(arrowAppendix.css("paddingBottom"));
						clippingData.containerHeight -= arrowHeight;
						this.wrapper.css("height", clippingData.containerHeight);
					}
				}
			}
		},
		setParent: function (parent) {
			this.parentContainer = parent;
			return this;
		},
		scroll: function (e) {
			e.preventDefault();
			var originalEvent = e.originalEvent,
				deltaY = originalEvent.deltaY ? -originalEvent.deltaY : originalEvent.wheelDeltaY || 0;
			this.move(deltaY)
		},
		getItem: function (index) {
			if (index instanceof this.listItem) {
				return index;
			} else if (typeof index === "number") {
				var el = index < this.collection.length ? this.ul.children().eq(index) : undefined, view;
				if (el && el.length && (view = el.getLao()) && view.model) {
					return view;
				}
			}
		},
		select: function (index) {
			var view = this.getItem(index);
			if (view && this.selectedItem !== view) {
				if (this.selectedItem) {
					this.selectedItem.unselect();
				}
				view.select(this.expandDirection);
				this.selectedItem = view;
			}
		},
		unselect: function (index) {
			if (this.selectedItem) {
				this.selectedItem.unselect();
				delete this.selectedItem;
			}
		},
		arrowHandler: function (dir, arrow) {
			var delta = dir * 5,
				interval = 40,
				intervalIndex = win.setInterval(_.bind(function () {
					this.move(-delta);
				}, this), interval);
			$(arrow).one("mouseout", function () {
				win.clearInterval(intervalIndex);
			})
		},
		arrowDownHandler: function (e) {
			this.arrowHandler(1, e.currentTarget)
		},
		arrowUpHandler: function (e) {
			this.arrowHandler(-1, e.currentTarget)
		},
		events: {
			"mouseover .LaoDropdownDown": "arrowDownHandler",
			"mouseover .LaoDropdownUp": "arrowUpHandler"
		}
	}),
	Dropdown = Lao.extend("Component", {
		template: "<div></div>",
		className: "LaoDropdownContainer",
		isOpen: false,
		initialize: function (attr) {
			this.menu = attr.menu;
			this.root = Lao.create("Dropdownmenu", {
				collection: attr.menu
			});

			this.openMenus = [];

			eventSpawner
			.on("open", function (menu) {
				this.openMenus.push(menu);
			}, this)
			.on("close", function (menu) {
				var index = _.indexOf(this.openMenus, menu),
					length = this.openMenus.length, lastIndex = length - 1,
					menusToClose, menuToClose;
				if (index > -1) {
					menusToClose = this.openMenus.splice(index, lastIndex);
					while (menuToClose = menusToClose.pop()) {
						menuToClose; // what exactly did I want to do?
					}
				} // else: weird!
			}, this)
			.on("choose", function (model) {
				this.trigger("choose", model);
			}, this);
		},
		open: function (x, y) {
			if (!this.isOpen) {
				this.appendTo(doc.body);
				this.delegateEvents();
				this.root.setParent(this).open(x,y);
				this.isOpen = true;
			}
		},
		determineItem: function (e) {
			var target = e.target, container = this[0], $target, view, parent;
			while (target != container && !$(target).hasClass("LaoDropdownItem")) {
				target = target.parentNode || container;
			}
			$target = $(target);
			view = $target.getLao();
			if (target === container) {
				var menu = this.openMenus[this.openMenus.length - 1];
				if (menu) menu.unselect();
			} else if (view && (parent = view.getParentMenu())) {
				parent.select(view);
			}
		},
		close: function (e) {
			if (!e || e.target === this[0]) {
				this.undelegateEvents();
				var menu = this.openMenus[0], self = this;
				this.fadeOut(100, function () {
					if (menu) menu.close();
					self.trigger("close");
					$(this).removeAttr("style").detach();
				});
				this.isOpen = false;
			} else if (e) {
				var target = e.target, container = this[0], $target, view, ret;
				while (target != container && !$(target).hasClass("LaoDropdownItem")) {
					target = target.parentNode || container;
				}
				$target = $(target);
				view = $target.getLao();
				if (view) {
					ret = view.chooseOption();
				}
				if (ret) {
					this.close();
				}
			}
		},
		events: {
			"mousemove": "determineItem",
			"click": "close",
			"scroll": function (e) {e.preventDefault();}
		}
	})

	Lao.define({
		"Dropdownitem": DropdownItem,
		"Dropdownmenu": DropdownMenu,
		"Contextmenu": Dropdown
	})

})(window, document, Backbone, _, jQuery, Lao);