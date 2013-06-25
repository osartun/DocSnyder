(function (win, doc, undefined) {

	var 
	rElementSelector = /\*|[\.#]?[-\w\d]+|\[[-\w\d]+\]|\[[-\w\d]+([~\|]?=)([-\w\d]+)\]/g,
	elementSource = /[\*\.#-\w\d\[~\|=\]]+/.source,
	rSingleCombinator = /[\s+>]/,
	rCombinators = /[\s>+]?\s*[\*\.#-\w\d\[\]~\|=]+/g,
	rORselector = new RegExp("\s*" + rCombinators.source + "\s*,?", "g"),
	rwhitespace = /\s+/g,
	rword = /\w+/g;

	var
	typemap = {
		"*": 0,
		"tag": 1,
		"#": 2,
		".": 3,
		"[": 4,
		"~=": 5,
		"|=": 6,
		"=": 7
	},
	combinatormap = {
		"": 0, // no combinator
		" ": 1, // any descendant
		">": 2, // direct descendant
		"+": 3 // preceding sibling
	}

	// Borrowed from jQuery
	var coreTrim = "".trim,
		rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,
		trim = coreTrim && !coreTrim.call("\uFEFF\xA0") ?
			function(text) {
				return text == null ? "" : coreTrim.call( text );
			} :
			// Otherwise use our own trimming functionality
			function(text) {
				return text == null ? "" : ( text + "" ).replace( rtrim, "" );
			}

	function parseElementSelector (selector) {
		var res = [], type, name;
		if (selector && typeof selector === "string") {
			selector.replace(rElementSelector, function (match, attrSpec, attrVal) {
				type = typemap[match[0]];
				if (type === undefined) {
					// This is a tag selector.
					type = typemap["tag"];
					name = match;
				} else if (type === typemap["["]) {
					// This is an attribute selector. Define attribute type:
					type = attrSpec ? typemap[attrSpec] : type;
					name = match.substr(1, match.indexOf(attrSpec || "]") - 1);
				} else {
					name = match.substr(1);
				}
				res.push(type, name, attrVal);
			})
		}
		return res;
	}
	function parseCombinators (selector) {
		var match = selector.match(rCombinators), s, combinator, element, res = [0];
		while (match && (s = match.pop())) {
			combinator = rSingleCombinator.test(s[0]) ? 
				rwhitespace.test(s[0]) ? " " : s[0] :
				"";
			element = combinator ? trim(s.substr(1)) : s;

			res.push(parseElementSelector(element), combinatormap[combinator])
		}
		res.pop();
		return res;
	}
	function parseSelectorstring (selector) {
		var matches, match, res = [], type;
		if (typeof selector === "string" && (selector = trim(selector).toUpperCase())) {
			matches = selector.split(",");
			while (matches && (match = matches.shift())) {
				res.push(parseCombinators(trim(match)))
			}
		}
		return res;
	}

	// Checker functions

	function hasAttribute (element, type, attr, val) {
		var value = (element.getAttribute(attr) || "").toUpperCase();
		switch (type) {
			case 4: // Has attribute set
				return value != null;
			case 5: // value is a spaceseperated list and contains val
				// We replace all whitespaces with actual single space characters
				return value && (" " + value.replace(rwhitespace, " ") + " ").indexOf(" " + val + " ") > -1;
			case 6: // value is either equal to val or begins with val immediately followed by "-"
				return value && (value === val || value.indexOf(val + "\u002d") === 0);
			case 7: // value is equal to val
				return value == val;

		}
	}

	function hasClass (element, classname) {
		return hasAttribute(element, typemap["~="], "class", classname);
	}

	function checkElement (element, type, name, val) {
		switch (type) {
			case 0: // everything
				return true;
			case 1: // tagname
				return element.nodeName.toUpperCase() === name;
			case 2: // id
				return element.id && element.id.toUpperCase() === name;
			case 3: // classname
				return hasClass(element, name);
			case 4:
			case 5:
			case 6:
			case 7: // Those are the attribute functions
				return hasAttribute(element, type, name, val);
		}
		return false;
	}

	function isElement (element, parsedElementSelector) {
		if (element && element.nodeName) {
			for (var i = 2, l = parsedElementSelector.length, res = true, type, name, val; i < l; i += 3) {
				type = parsedElementSelector[i - 2];
				name = parsedElementSelector[i - 1];
				val = parsedElementSelector[i];

				res &= checkElement(element, type, name, val);
				if (!res) break;
			}
			return !!res;
		} else {
			return false;
		}
	}

	function getElement (el, dir) {
		// Returns the first *element* (not just node) in a specific direction
		while (el && (el = el[dir]) && el.nodeType !== 1) { }
		return el;
	}

	function checkCombinator (element, type, selector) {
		// Returns the matching element or false if the combination didn't match
		var cur = element;
		if (type === 1) {
			// any descendants
			while (cur = cur.parentNode) {
				if (cur.nodeType === 1 && isElement(cur, selector)) {
					return cur;
				}
			}
			return false;
		} else {
			switch (type) {
				case 2: cur = getElement(cur, "parentNode"); break;
				case 3: cur = getElement(cur, "previousSibling"); break;
			}
			return isElement(cur, selector) ? cur : false;
		}
	}

	function isCombinator (element, parsedCombinator) {
		for (var i = 1, l = parsedCombinator.length, cur = element, elementSelector, combinator; i < l; i += 2) {
			combinator = parsedCombinator[i - 1];
			elementSelector = parsedCombinator[i];

			cur = checkCombinator(cur, combinator, elementSelector);
			if (cur === false) return false;
		}
		return true;
	}

	function is (element, parsedSelector, bubble) {
		if (element) {
			var i = 0, l = parsedSelector.length, parentElement;
			for (; i < l; i++) {
				// Loop through the different selectors
				if (isCombinator(element, parsedSelector[i])) {
					return true;
				}
			}
			if (bubble) {
				// Get the element's parent *element* (nodeType === 1)
				parentElement = getElement(element, "parentNode");
				return is (parentElement, parsedSelector, bubble);
			}
		}
		return false; // The element matched none of the selectors
	}

	function returnFalse() {
		return false;
	}

	var prev = win.createSelectorCheck,
	createSelectorCheck = win.createSelectorCheck = function (selector, bubble) {
		var parsedSelector = parseSelectorstring(selector),
		prevElement, prevResult;
		return parsedSelector.length && parsedSelector[0] ?
			function (element) {
				if (element === prevElement) {
					return prevResult;
				} else {
					prevElement = element;
					return prevResult = is(element, parsedSelector, bubble);
				}
			} :
			returnFalse;
	}
	createSelectorCheck.noConflict = function () {
		if (prev) {
			win.createSelectorCheck = prev;
		} else {
			delete win.createSelectorCheck;
		}
		return createSelectorCheck;
	}
})(window, document);