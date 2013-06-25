(function (win, doc, $, _, Lao) {

	// Lao-Utilities

	var isNumeric = $.isNumeric,
		BackboneCollection = Backbone.Collection.prototype,
		BackboneModel = Backbone.Model.prototype,
		Model = Backbone.Model.extend({
			toJSON: function () {
				var ret = _.clone(this.attributes);
				_.each(ret, function (val, key) {
					if (val && typeof val.toJSON === "function") {
						ret[key] = val.toJSON();
					}
				})
				return ret;
			}
		}),
		Collection = Backbone.Collection;

	Lao.SelectManager = Collection.extend({
		latestSelectedIndex: undefined,
		_createModelRange: function (from, until) {
			var tmp, models = [];
			if (from > until) {
				tmp = until;
				until = from;
				from = tmp;
			}
			for (; from <= until; from++) {
				models.push({id: from})
			}
			return models;
		},
		_getModelRange: function (from, until) {
			var tmp, m, models = [];
			if (from > until) {
				tmp = until;
				until = from;
				from = tmp;
			}
			for (; from <= until; from++) {
				if (m = this.get(from)) {
					models.push(this.get(from));
				}
			}
			return models;
		},
		selectRange: function (from, until, options) {
			if (isNumeric(from) && isNumeric(until)) {
				var models = this._createModelRange(from, until);

				if (options && !options.single) {
					this.add(models);
				} else {
					this.reset(models);
				}
			}
		},
		select: function (index, options) {
			if (index > -1) {

				options || (options = {});

				var currentLatestIndex = this.latestSelectedIndex, 
					m, minIndex, maxIndex, i, models = [];

				if (m = this.get(index)) {
					if (options.unselect) {
						delete this.latestSelectedIndex;
						this.remove(m);
					}
				} else {
					this.latestSelectedIndex = index;
					if (options.single || options.range && currentLatestIndex === undefined) {
						this.reset({id: index});
					} else if (!options.single && options.range) {
						this.selectRange(currentLatestIndex, index);
					} else if (!options.single) {
						this.add({id: index});
					}
				}
			}
		},
		selectAll: function (highestIndex) {
			if (highestIndex > -1) {
				this.latestIndex = highestIndex;
				this.reset(this._createModelRange(0, highestIndex));
			}
		},
		unselect: function (index, options) {
			if (index > -1) {

				var currentLatestIndex = this.latestSelectedIndex,
				m = this.get(index);
				if (!m) return;
				this.latestSelectedIndex = index;

				if (!options || options.unselect) {
					this.remove(m);
				} else if (options.range && this.latestSelectedIndex !== undefined) {
					this.remove(this._getModelRange(currentLatestIndex, index));
				}
			}
		},
		unselectAll: function () {
			this.reset();
		},
		toggleSelect: function (index, options) {
			if (index > -1) {

				options || (options = {});

				if (this.get(index)) {
					if (options.unselect || options.range) {
						this.unselect(index, options);
					}
				} else {
					this.select(index, options);
				}
			}
		}
	});

	Lao.FocusManager = Model.extend({});

	Lao.ComponentData = Model.extend({
		getStyleDeclaration: function () {
			var attributes = this.attributes,
				attributeMap = this.attributeMap,
				valueMap = this.valueMap,
				attribute, value,
				styleDeclaration = {};
			if (attributeMap) {
				_.each(attributes, function (val, attr) {
					if (attribute = attributeMap[attr]) {
						value = valueMap[attribute] ? _.isFunction(valueMap[attribute]) ? valueMap[attribute](val) : valueMap[attribute] : val;
						styleDeclaration[attribute] = value;
					}
				}, this);
			}
			return styleDeclaration;
		}
	});

	Lao.Icon = Lao.ComponentData.extend({
		valueMap: {
			"backgroundImage": function (val) {
				return "url(" + val + ")";
			}
		},
		attributeMap: {
			"sprite": "backgroundImage",
			"width": "width",
			"height": "height",
			"img": "backgroundImage",
			"clip": "backgroundPosition"
		}
	});

	var MenuItem = Model.extend({
		defaults: {
			"name": ""
		},
		initialize: function (attr) {
			if (attr.menu) {
				if (!(attr.menu instanceof Menu)) {
					this.set("menu", new Menu(attr.menu), {silence: true});
				}
				var menu = this.get("menu").isRoot(false);
				menu.parentMenu = this.collection;
			}
		},
		validate: function (attr) {
			if (attr.icon && !(attr.icon instanceof Lao.Icon) ) {
				return "The icon must be an instance of Lao.Icon";
			}
			if (attr.menu && !(attr.menu instanceof Menu) ) {
				return "The menu must be an instanceof of Lao.Menu";
			}
		}
	}),
	Menu = Lao.Menu = Collection.extend({
		model: MenuItem,
		_isRoot: true,
		isRoot: function (val) {
			if (val === false) {
				// You can only falsify _isRoot
				this._isRoot = val;
			}
			return this._isRoot;
		}
	})

})(window, document, jQuery, _, Lao)