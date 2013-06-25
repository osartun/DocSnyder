(function (win, doc, Backbone, _, $, Lao) {


	var SelectableList = Lao.extend("List", {
		template: '<div><ul class="LaoList"><!-- Lao:Appendpoint --></ul></div>',
		className: "LaoListWrapper",
		selectClass: "LaoListItem-select",
		latestSelectClass: "LaoListItem-latest",
		SelectManager: Lao.SelectManager,
		getLiElements: function (selector) {
			return this.ulElement.children(selector);
		},
		getLiElement: function (index) {
			if (typeof index === "number") {
				return this.getLiElements().get(index);
			} else if (index.nodeName) {
				var el = index, ul = this.ulElement[0], body = doc.body;

				while (el && el !== this[0] && el !== body) {
					if (el.nodeName === "LI" && el.parentNode === ul) {
						return el;
					}
					el = el.parentNode;
				}
			}
		},
		forwardEvent: function (obj) {
			return this.trigger.apply(this, _.isArguments(obj) ? obj : arguments);
		},
		initialize: function () {
			this.selectManager = this.options.SelectManager ? new this.options.SelectManager : new this.SelectManager;
			this.ulElement = this.children().eq(0);

			this.selectManager
			.on("add", this._addSelectedItem, this)
			.on("remove", this._removeSelectedItem, this)
			.on("reset", this._resetSelectCollection, this)
			.on("change:latestIndex", this._changeLatestIndex, this)
			.on("all", function () {
				this.forwardEvent(arguments);
			}, this)
		},
		_addSelectedItem: function (m, c, options) {
			var index = m.get("id");
			$(this.getLiElement(index)).addClass(this.options.selectClass || this.selectClass);
		},
		_removeSelectedItem: function (m, c, options) {
			var index = m.get("id");
			$(this.getLiElement(index)).removeClass(this.options.selectClass || this.selectClass);
		},
		_resetSelectCollection: function (c, options) {
			var items = this.getLiElements(),
				selectClass = this.options.selectClass || this.selectClass;

			items.removeClass(selectClass);

			c.each(function (m) {
				items.eq(m.get("id")).addClass(selectClass)
			}, this)
		},
		_changeLatestIndex: function (latest, prev) {
			var liElements = this.getLiElements(),
				latestSelectClass = this.latestSelectClass;
			if (prev !== undefined) {
				liElements.eq(prev).removeClass(latestSelectClass)
			}
			if (latest !== undefined) {
				liElements.eq(latest).addClass(latestSelectClass);
			}
		},
		elementIsInListitem: function (el) {
			return el && el !== this[0];
		},
		selectHandler: function (e) {
			if (this.elementIsInListitem(e.target)) {
				var li = this.getLiElement(e.target), // like $.fn.parents(), but faster,
					index = li ? this.getLiElements().index(li) : -1;
				this.selectManager.toggleSelect(index, {
					range: e.shiftKey,
					single: !(e.metaKey || e.shiftKey),
					unselect: e.metaKey
				});
			} else {
				this.selectManager.unselectAll();
			}
		},
		additionalEvents: {
			"click": "selectHandler"
		}
	});

	Lao.define("SelectableList", SelectableList)

})(window, window.document, window.Backbone, window._, window.jQuery, window.Lao);