(function (win, doc, $, _, Backbone, root) {

	function createDIV() {
		return $(document.createElement("div"));
	}

	function parseHTML(html, callback, context) {
		var container = createDIV().css({
			position: "relative"
		}).html(html).appendTo(doc.body), res;
		container.children().each(function (i, el) {
			if ((res = callback.call(context, el)) !== undefined) {
				return false;
			}
		});
		container.remove();
		return res;
	}

	function findIdealDimensions (el) {
		var rightest = 0, deepest = 0,
		$child, position, rightEnd, bottomEnd;
		parseHTML($(el).html(), function (child) {
			$child = $(child);
			position = $child.position();
			if ((rightEnd = position.left + $child.width()) > rightest) {
				rightest = rightEnd;
			}
			if ((bottomEnd = position.top + $child.height()) > deepest) {
				deepest = bottomEnd;
			}
		});
		return {
			"width": rightest,
			"height": deepest
		}
	}

	function getNodesOfType (el, nodeType, callback) {
		var nodeList = [], i, children, l;

		function iterator (node) {
			if (node.nodeType === nodeType) {
				if (!callback || callback(node)) {
					nodeList.push(node);
				} else {
					for (i = 0, children = node.childNodes, l = children.length; i < l; i++) {
						iterator (children[i]);
					}
				}
			}
		}

		return nodeList;
	}

	function getTextNodes (el) {
		var whitespace = /^\s*$/;
		return getNodesOfType(el, 3, function (node) {return !whitespace.test(node.nodeValue)});
	}

	function getTextWrappers (el) {
		// Finds all block elements which contain textnodes
		var textnodes = getTextNodes(el), textWrappers = [], i = 0, l = textnodes.length, parent;
		for (; i < l; i++) {
			parent = textnodes[i];
			while (parent && (parent = parent.parentElement) && jQuery.css(parent, "display") !== "block");
			if (parent && !_.contains(textWrappers, parent)) textWrappers.push(parent);
		}
		return textWrappers;
	}

	function getImageElements (el) {
		return el && el.getElementsByTagName ? el.getElementsByTagName("img") : [];
	}

	function hasFineStructure (el) {
		// This function tests if the element and its contents are constructed like
		// our HTML Export. If so, we use a diffrent, faster parsing algorithm.
		var isFine = true, itemContentTagNames = /^(DIV|IMG|P)$/;

		// Document Level
		if (isFine &= el.tagName === "DIV") {
			$(el).children().each(function (i, page) {
				// Page Level
				if (isFine &= page.tagName === "DIV") {
					$(page).children().each(function (j, item) {
						// Item Level
						isFine &= itemContentTagNames.test(item.tagName)
					})
				}
			})
		}

		return isFine;
	}

	var
	Importer = Backbone.Model.extend({
		parseItemContent: function (type, html) {
			if (type === "html") {
				return parseHTML(html, function (el) {
					var $el = $(el), res = {
						"width": $el.width(),
						"height": $el.height()
					};

					switch (el.tagName) {
						case "IMG":
							return _.extend({
								"type": "Image",
								"url": el.src
							}, res);
						case "P":
							return _.extend({
								"type": "Text",
								"content": $el.html()
							}, res);
						case "DIV":
							return _.extend({
								"type": "Plain",
								"color": $el.css("background")
							}, res);
					}
				})
			}
		},
		parseItems: function (type, html) {
			if (type === "html") {
				var items = [], $item, position;
				parseHTML(html, function (itemEl) {
					$item = $(itemEl);
					position = $item.position();
					if (!itemEl.style.width) {
						$item.css(findIdealDimensions(itemEl));
					}
					items.push({
						"width": $item.width(),
						"height": $item.height(),
						"content": this.parseItemContent("html", $item.html()),
						"x": position.left,
						"y": position.top
					})
				}, this);
				return items;
			}
		},
		parseDoc: function (type, html) {
			if (type === "html") {
				var pages = [], $el, elWidth, bodyWidth = $(doc.body).width();
				parseHTML(html, function (el) {
					$el = $(el);
					if (!el.style.width) {
						$el.css(findIdealDimensions(el));
					}
					pages.push({
						width: $el.width(),
						height: $el.height(),
						itemList: this.parseItems("html", $el.html())
					})
				}, this)
				return pages;
			}
		},
		import: function (type, data) {
			if (!data && (type = $.trim(type))[0] === "<") {
				data = type;
				type = "html";
			} else if (!data) {
				return; 
			} else {
				type = type.toLowerCase();
			}
			var docData = this.parseDoc(type, data);
			root.document.get("pageList").reset(docData);
		}
	}),
	Exporter = Backbone.View.extend({
		exportHTML: function () {
			var docEl = createDIV(),
			pages = root.document.get("pageList"),
			items, container, pageEl, itemEl;

			pages.each(function (page) {
				pageEl = createDIV().css({
					width: page.get("width"),
					height: page.get("height"),
					position: "relative"
				}).appendTo(docEl);
				items = page.get("itemList");

				items.each(function (item) {
					if (item.get("visible")) {
						createDIV()
						.css({
							width: item.get("width"),
							height: item.get("height"),
							position: "absolute",
							top: item.get("y"),
							left: item.get("x")
						})
						.append(item.get("content").exportHTML())
						.appendTo(pageEl);
					}
				})
			})

			return docEl.html();
		},
		export: function (type) {
			type = (type || "HTML").toUpperCase();
			if (this["export" + type]) {
				return this["export" + type]();
			}
		}
	})

	root.supply({
		"Importer": new Importer,
		"Exporter": new Exporter({
			el: $(".ds-canvas")
		})
	});
})(window, document, window.jQuery, window._, window.Backbone, window.ds);