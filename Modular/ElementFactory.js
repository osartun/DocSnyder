(function (win, doc, $) {
	var createElement = function (tagname, id, className, attributes, parent) {
		var element = document.createElement(tagname), $el;
		if (id) element.id = id;
		if (className) element.className = className;
		if (parent) {
			if (parent.appendChild) {
				parent.appendChild(element);
			} else if (parent[0] && parent[0].appendChild) {
				parent[0].appendChild(element);
			}
		}
		return typeof attributes === "object" ? $(element).attr(attributes)[0] : element;
	},
	ElementFactory = win.ElementFactory = function (defaults) {
		this.defaults = $.extend({
			tagname: "div",
			classPrefix: "",
			idPrefix: "",
			cache: new ElementCache
		}, defaults);
	},
	ElementCache = win.ElementCache = function () {
		this.idCache = {};
		this.classNameCache = {}
	};

	ElementFactory.prototype = {
		create: function (structure, parentNode) {
			var i = 0, l = structure.length, elemData, defaults = this.defaults, cache = defaults.cache, el, id, className, ret = [];
			for (; i < l; i++) {
				elemData = structure[i];

				className = $.isArray(elemData.className) ? $.map(elemData.className, function (name) {
					return defaults.classPrefix + name;
				}).join(" ") : elemData.className ? defaults.classPrefix + elemData.className : false;

				id = elemData.id ? defaults.idPrefix + elemData.id : false;

				el = createElement(elemData.tagname || defaults.tagname, id, className, elemData.attributes || defaults.attributes, parentNode);

				if (elemData.children) {
					this.create(elemData.children, el);
				}

				if (cache) {
					cache.add(el, id, className);
				}

				ret.push(el);
			}
			return $(l <= 1 ? ret[0] : ret);
		}
	};

	ElementCache.prototype = {
		add: function (element, id, className) {
			if (element) {
				if (!element.nodeName && element[0] && element[0].nodeName) {
					element = element[0];
				} else if (!element.nodeName) {
					return;
				}

				if (!id && id !== false) {
					// if the id-argument is set to false it means 
					// there is no id or the Element shouldn't be 
					// cached by id
					id = element.id;
				}

				if (!className && className !== false) {
					className = element.className;
				}

				if (id) {
					this.idCache[id] = element;
				}

				if (className) {
					(this.classNameCache[className] || (this.classNameCache[className] = [])).push(element);
				}
			}
		},
		get: function (selector) {
			if (selector[0] === '#') {
				return this.getById(selector.substr(1));
			} else if (selector[1] === '.') {
				return this.getByClass(selector.substr(1));
			}
			return $();
		},
		getById: function (id) {
			return $(this.idCache[id]);
		},
		getByClass: function (className) {
			return $(this.classNameCache[className]);
		}
	}
})(window, document, window.jQuery);