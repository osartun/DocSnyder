(function (win, doc, Backbone, _, $) {

	var getPrototype = (function () {
			if (typeof Object.getPrototypeOf === "function") {
				return Object.getPrototypeOf;
			} else {
				// from John Resig
				if ( typeof "test".__proto__ === "object" ) {
					return function (obj) {
						return obj ? obj.__proto__ : null;
					}
				} else {
					return function (obj) {
						return obj && obj.constructor ? obj.constructor.prototype : null;
					}
				}
			}
		})(),
	getPrototypeChain = function (prototype) {
		var list = [prototype], indexOf = _.indexOf;
		while ( prototype && (prototype = getPrototype(prototype)) && prototype !== list[list.length - 1] ) {
			if (indexOf(list, prototype) === -1) {
				list.push(prototype);
			}
		}
		return list;
	}, clearOut = function (array) {
		// Removes falsy and double values.
		return _.unique( _.compact(array) );
	}, pluckInheritanceList = function (inheritanceList, propertyName) {
		return clearOut(_.pluck(inheritanceList, propertyName));
	}

	var prevLao = win.Lao,
	Laos = {},
	BbView = Backbone.View,
	BbViewProto = BbView.prototype,
	extend = BbView.extend,
	jQueryFn = $.fn,
	Lao = (win.Lao = {
		VERSION: "0.1",
		noConflict: function () {
			win.Lao = prevLao;
			return Lao;
		},
		get: function (name) {
			if (name in Laos) {
				return Laos[name];
			}
		},
		create: function (name, data) {
			var type = typeof name;
			if (type === "string") {
				if (name in Laos) {
					return new Laos[name](data);
				}
			} else if (type === "function") {
				return new name(data);
			}
		},
		extend: function (name, proto) {
			var P = Lao.get(name);
			if (P && _.isFunction(P.extend)) {
				return P.extend(proto);
			} else {
				throw new Error("\"" + name + "\" can't be extended because it's not defined")
			}
			return this;
		},
		define: function (name, constructor) {
			if (_.isObject(name)) {
				return $.each(name, this.define);
			}
			var prototype = constructor ? constructor.prototype : {},
				inheritanceList = getPrototypeChain(prototype);
			if (typeof prototype.template === "string") {
				prototype.template = _.template(prototype.template);
			}
			prototype.initializeFunctions = pluckInheritanceList(inheritanceList, "initialize");
			prototype.classNames = pluckInheritanceList(inheritanceList, "className");
			Laos[name] = constructor;
		}
	}),
	rootjQuery = $(document),
	getCommentNodes = function (elem, commentNodes) {
		$(elem).contents().each(function() {
			if (this.nodeType === 8) {
				commentNodes.push(this);
			} else if (this.nodeType === 1 || this.nodeType === 11) {
				getCommentNodes(this, commentNodes);
			}
		})
	},
	isCommentNode = function (elem) {
		return elem && elem.nodeType === 8;
	},
	getLaoType = function (comment) {
		var res = r_LaoData.exec(comment.nodeValue);
		return res ? res[1] : null;
	},
	createLaoNodeHTML = function (value) {
		return "<!-- Lao:" + value + " -->";
	},
	r_LaoData = /Lao:(\w+)/;
	
	$.fn.getLao = function () {
		if (this[0] && this[0].nodeName) {
			return $.data(this[0], "Lao");
		}
	};
	$.fn.removeLao = function () {
		if (this[0] && this[0].nodeName) {
			return $.removeData(this[0], "Lao");
		}
	}

	/**
	 * The jQuery-Extension object.
	 */
	function jQX () {
		if (!(this instanceof jQX)) {
			var arg = arguments;
			return new jQX(arg[0], arg[1], arg[2], arg[3], arg[4]);
		}
		this._initialize.apply(this, arguments);
	};
	_.extend(jQX.prototype, jQueryFn, BbViewProto, {
		constructor: jQueryFn.constructor,
		className: "LaoObject",
		emulateBbView: function () {
			this.isInit = true;
			BbViewProto.constructor.apply(this, arguments);
			delete this.isInit;
		},
		setElement: function (element, delegate) {
			if (this.isInit) {
				this.$el = $(this[0]);
				this.el = this[0];
				this.addClass(this.classNames.join(" "));
				this.delegateEvents();
			} else {
				if (this.$el) {
					this.undelegateEvents();
					$.data(this.el, "Lao", null);
				}
				this.replaceWith(element);
				this.$el = this;
				this.el = this[0];
				this.addClass(this.classNames.join(" "));
			    if (delegate !== false) this.delegateEvents();
			}
			$.data(this.el, "Lao", this);
		    return this;
		},
		remove: function () {
			this.undelegateEvents();
			this.removeLao();
			return jQueryFn.remove.apply(this, arguments);
		},
		getCommentNodes: function () {
			var comments = [];
			this.each(function() {
				getCommentNodes(this, comments);
			});
			return comments;
		},
		registerAppendPoints: function () {
			var comments = this.getCommentNodes(), type,
			appendPoints = _.filter(comments, function (comment) {
				if ((type = getLaoType(comment)) && type === "Appendpoint") {
					comment.lao || (comment.lao = {});
					comment.lao.type = type[1];
				}
				return !!type;
			});
			this.appendPoints = $(appendPoints);
		},
		getAppendPoints: function (index) {
			if (!("appendPoints" in this)) {
				this.registerAppendPoints();
			}
			return _.isNumber(index) ? this.appendPoints.eq(index) : this.appendPoints;
		},
		_initialize: function (data, options) {
			this.constructor = jQueryFn.constructor;
			if (typeof this.template === "string") {
				this.template = _.template(this.template);
			}
			if (typeof this.template === "function") {
				this.init(this.template( data && data.toJSON ? data.toJSON() : data.model && data.model.toJSON() || data.collection && data.collection.toJSON() || data ));
				this.el = this[0];
			}
			if (this.additionalEvents) {
				if (this.events) {
					_.extend(this.events, this.additionalEvents);
				} else {
					this.events = this.additionalEvents;
				}
			}

			this.initialize = $.noop;
			this.emulateBbView(data || {});
			this.registerAppendPoints();
			_.each(this.initializeFunctions, function (fn) {
				if (fn !== $.noop) {
					fn.call(this, data, options);
				}
			}, this);
		},
		init: function (selector, context) {
			jQuery.merge( this, jQueryFn.constructor.call(this, selector, context) );
		},
		render: function () {
			var o = this.options, template, appendPoints, i,l, appPoint, tmplStart, iterator, tmplEnd, replaceElements, html;
			if (o && o.template) {
				template = o.template;

				if (_.isString(template)) {
					template = o.template = [_.template(template)];
				}
				if (_.isArray(template) && _.isString(template[0])) {
					for (i = 0, l = template.length; i < l; i++) {
						if (_.isString(template[i])) {
							template[i] = _.template(template[i]);
						}
					}
				}
				if (_.isArray(template) && _.all(o.template, _.isFunction)) {
					appendPoints = this.getAppendPoints();
					for (i = 0, l = appendPoints.length; appPoint = appendPoints.eq(i), i < l; i++) {
						html = template[i](this.model || this.collection || this)

						if ((tmplStart = appPoint[0].nextSibling) && isCommentNode(tmplStart) && getLaoType(tmplStart) === "TemplateStart") {
							replaceElements = $();
							iterator = tmplStart;
							while ((iterator = iterator.nextSibling) != null && !(isCommentNode(iterator) && getLaoType(iterator) === "TemplateEnd")) {
								replaceElements = replaceElements.add(iterator);
							}
						}

						if (replaceElements && replaceElements.length) {
							replaceElements.remove();
							$(tmplStart).after(html);
						} else {
							appPoint.after(createLaoNodeHTML("TemplateStart") + html + createLaoNodeHTML("TemplateEnd"));
						}
					}
				}
			}
			return this;
		},
		initialize: $.noop
	});
	jQX.extend = extend;

	Lao.define("Component", jQX);

})(window, window.document, window.Backbone, window._, window.jQuery);