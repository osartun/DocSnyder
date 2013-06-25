(function (win, doc, $, _) {
	if (!$) return;

	if (!_) {
		// If Underscore is available use the great Underscore library
		// else create a shim for it from jquery functions
		_ = {
			each: function (list, iterator, context) {
				$.each(list, function (i, val) {
					iterator.call(context, val, i, list);
				})
			},
			map: $.map,
			isArray: $.isArray,
			isString: function (str) {
				return typeof str === "string";
			},
			isFunction: $.isFunction,
			isNumber: $.isNumeric,
			extend: $.extend
		};
	}

	var slice = Array.prototype.slice,
		fromCharCode = String.fromCharCode,
		charCodeAt = String.prototype.charCodeAt,
		toCharCode = function (str) {
			return typeof str === "string" ? charCodeAt.call(str, 0) : 0;
		},
		r_whitespace = /^[\s\t\r\n ]$/,
		whitespaceNames = {
			/* Control characters */
			"\u0009": "HORIZONTAL_TAB",
			"\u000A": "LINE_FEED",
			"\u000B": "VERTICAL_TAB",
			"\u000C": "FORM_FEED",
			"\u000D": "CARRIAGE_RETURN",
			/* Seperator characters */
			"\u0020": "SPACE",
			"\u0085": "NEXT_LINE",
			"\u00A0": "NO_BREAK_SPACE",
			"\u1680": "OGHAM_SPACE_MARK",
			"\u180E": "MONGOLIAN_VOWEL_SEPERATOR",
			"\u2000": "EN_QUAD",
			"\u2001": "EM_QUAD",
			"\u2002": "EN_SPACE",
			"\u2003": "EM_SPACE",
			"\u2004": "THREE_PER_EM_SPACE",
			"\u2005": "FOUR_PER_EM_SPACE",
			"\u2006": "SIX_PER_EM_SPACE",
			"\u2007": "FIGURE_SPACE",
			"\u2008": "PUNCTUATION_SPACE",
			"\u2009": "THIN_SPACE",
			"\u200A": "HAIR_SPACE",
			"\u2028": "LINE_SEPARATOR",
			"\u2029": "PARAGRAPH_SEPARATOR",
			"\u202F": "NARROW_NO_BREAK_SPACE",
			"\u205F": "MEDIUM_MATHEMATICAL_SPACE",
			"\u3000": "IDEOGRAPHIC_SPACE"
		};

	var KeyEvent = win.KeyEvent || {
		"ADD": 107,
		"ALT": 18,
		"BACK_QUOTE": 192,
		"BACK_SLASH": 220,
		"BACK_SPACE": 8,
		"CANCEL": 3,
		"CAPS_LOCK": 20,
		"CLEAR": 12,
		"CLOSE_BRACKET": 221,
		"COMMA": 188,
		"CONTEXT_MENU": 93,
		"CONTROL": 17,
		"DECIMAL": 110,
		"DELETE": 46,
		"DIVIDE": 111,
		"DOWN": 40,
		"END": 35,
		"ENTER": 14,
		"EQUALS": 61,
		"ESCAPE": 27,
		"F1": 112,
		"F2": 113,
		"F3": 114,
		"F4": 115,
		"F5": 116,
		"F6": 117,
		"F7": 118,
		"F8": 119,
		"F9": 120,
		"F10": 121,
		"F11": 122,
		"F12": 123,
		"F13": 124,
		"F14": 125,
		"F15": 126,
		"F16": 127,
		"F17": 128,
		"F18": 129,
		"F19": 130,
		"F20": 131,
		"F21": 132,
		"F22": 133,
		"F23": 134,
		"F24": 135,
		"HELP": 6,
		"HOME": 36,
		"INSERT": 45,
		"LEFT": 37,
		"META": 224,
		"MULTIPLY": 106,
		"NUMPAD0": 96,
		"NUMPAD1": 97,
		"NUMPAD2": 98,
		"NUMPAD3": 99,
		"NUMPAD4": 100,
		"NUMPAD5": 101,
		"NUMPAD6": 102,
		"NUMPAD7": 103,
		"NUMPAD8": 104,
		"NUMPAD9": 105,
		"NUM_LOCK": 144,
		"OPEN_BRACKET": 219,
		"PAGE_DOWN": 34,
		"PAGE_UP": 33,
		"PAUSE": 19,
		"PERIOD": 190,
		"PRINTSCREEN": 44,
		"QUOTE": 222,
		"RETURN": 13,
		"RIGHT": 39,
		"SCROLL_LOCK": 145,
		"SEMICOLON": 59,
		"SEPARATOR": 108,
		"SHIFT": 16,
		"SLASH": 191,
		"SPACE": 32,
		"SUBTRACT": 109,
		"TAB": 9,
		"UP": 38,
	},
	prefix = win.KeyEvent ? "DOM_VK_" : "",
	getKeyCodeFromConstant = function (constant) {
		return KeyEvent[prefix + constant];
	},
	getConstantFromKeyCode = function (keyCode) {
		if (_.isNumber(keyCode)) {
			for (var name in KeyEvent) {
				if (KeyEvent[name] === keyCode) {
					return prefix ? name.substr(prefix.length) : name;
				}
			}
		}
	},
	isPrintableMap = {},
	checkForPrintability = (function (testEl, textNode, body) {
		textNode.nodeValue = "";
		testEl.style.display = "inline";
		testEl.appendChild(textNode);

		var measure = function () {
			body.appendChild(testEl);
			var res = {
				width: testEl.offsetWidth,
				height: testEl.offsetHeight
			}
			body.removeChild(testEl);
			return res;
		},
		initMeasures = measure(),
		newMeasures, isPrintable;

		return function (str) {
			if (r_whitespace.test(str)) {
				return isPrintableMap[str] = false;
			} else {
				textNode.nodeValue = str || "";
				newMeasures = measure(),
				isPrintable = initMeasures.width !== newMeasures.width || initMeasures.height !== newMeasures.height
				return isPrintableMap[str] = isPrintable;
			}
		}
	})(doc.createElement("div"), doc.createTextNode(""), doc.body),
	isPrintableCharacter = function (charCode) {
		var str = fromCharCode(charCode);
		return (str in isPrintableMap ? isPrintableMap[str] : checkForPrintability(str));
	};

	/*
	 * This block of functions is for translating charCodes in characters and the other way round
	 */

	var getCharCodesFromString = function (str) {
		if (str.length > 1) {
			return [getCharCodeFromConstant(str)];
		}
		return [str.toLowerCase().charCodeAt(0), str.toUpperCase().charCodeAt(0)];
	}, getStringFromCharCode = function (charCode) {
		return isPrintableCharacter(charCode) ? fromCharCode(charCode) : getConstantFromCharCode(charCode);
	}

	/*
	 * This block of functions is for registering and unregistering keybindings:
	 */

	var codeBindings = {
		"char": {},
		"key": {}
	},
	modifierNames = ["alt", "ctrl", "meta", "shift"],
	modifierNamesObj = {
		"alt": true,
		"ctrl": true,
		"meta": true,
		"shift": true
	},
	modifierStringDelimiter = "-",
	defaults = {
		delimiter: "+"
	},
	globalOptions = _.extend({}, defaults);

	var parseMainKey = function (mainKey) {
		var length = mainKey.length, isWhitespace = r_whitespace.test(mainKey), type, codes, upperCase, lowerCase, code;
		if (isWhitespace) {
			type = "char";
			codes = toCharCode(mainKey);
		} else if (length === 1) {
			type = "char";
			upperCase = mainKey.toUpperCase();
			lowerCase = mainKey.toLowerCase();
			codes = [toCharCode(upperCase)];
			if (upperCase !== lowerCase) {
				codes[1] = toCharCode(lowerCase);
			}
		} else if (length > 1 && (code = getKeyCodeFromConstant(mainKey))) {
			type = "key";
			codes = [code];
		}
		if (type && codes) {
			return {
				"type": type,
				"codes": codes
			};
		}
	},
	registerListener = function (mainKey, arrayOfModifiers, callback, context) {
		var success = false, stringOfModifiers, keybindings, bindings, modifiedBindings, mainKeyData = parseMainKey(mainKey);
		if (mainKeyData && arrayOfModifiers && _.isArray(arrayOfModifiers) && arrayOfModifiers.length && callback) {
			stringOfModifiers = arrayOfModifiers.sort().join(modifierStringDelimiter);
			keybindings = codeBindings[mainKeyData.type];

			_.each(mainKeyData.codes, function (code) {
				if (code) {
					success = true;
					bindings = keybindings[code] || (keybindings[code] = {}),
					modifiedBindings = bindings[stringOfModifiers] || (bindings[stringOfModifiers] = []);

					modifiedBindings.push({
						"callback": callback,
						"context": context
					});
				}
			})
		}
		return success;
	},
	unregisterListener = function (mainKey, arrayOfModifiers, callback) {
		var success = false, stringOfModifiers, keybindings, bindings, modifiedBindings, i,l, listener, mainKeyData = parseMainKey(mainKey);
		if (mainKeyData && arrayOfModifiers && _.isArray(arrayOfModifiers) && arrayOfModifiers.length) {
			stringOfModifiers = arrayOfModifiers.sort().join(modifierStringDelimiter);
			keybindings = codeBindings[mainKeyData.type];

			if (!callback) {
				_.each(mainKeyData.codes, function (code) {
					if (code && (bindings = keybindings[code])) {
						success = true;
						delete bindings[stringOfModifiers];
					}
				})
			} else {
				_.each(mainKeyData.codes, function (code) {
					if (code && (bindings = keybindings[code]) && (modifiedBindings = bindings[stringOfModifiers])) {

						for (i = 0, l = modifiedBindings.length; (listener = modifiedBindings[i]); i++) {
							if (listener.callback === callback) {
								success = true;
								modifiedBindings.splice(i, 1);
								break;
							}
						};
					}
				})
			}
		}
		return success;
	};

	/*
	 * This block of function is for parsing and assembling shortcut-Strings:
	 */

	var parseShortcut = function (shortcut, specialDelimiter) {
		var keys = shortcut.toLowerCase().split(specialDelimiter || globalOptions.delimiter || defaults.delimiter),
			mainKey = [], modifiers = [];
		_.each(keys, function (key) {
			if (key = $.trim(key)) {
				if (key in modifierNamesObj) {
					modifiers.push(key);
				} else {
					mainKey.push(key.toUpperCase());
				}
			}
		});
		return (mainKey.length === 1 && modifiers.length) ? [mainKey[0], modifiers] : null;
	}, assembleShortcut = function (mainKey, modifiers, specialDelimiter) {
		return modifiers.concat([mainKey.toUpperCase()]).join(specialDelimiter || globalOptions.delimiter || defaults.delimiter);
	}, parseKeyevent = function (e) {
		var mainKey = getStringFromCharCode(e.charCode),
			modifiers = [];
		_.each(modifierNames, function (name) {
			if (e[name + "Key"]) {
				modifiers.push(name);
			}
		});
		return [mainKey, modifiers];
	}, getKeybindingFromKeyevent = function(e, callback, context) {
		var parsed = parseKeyevent(e);
		if (parsed[0] && parsed[1].length) {
			registerListener(parsed[0], parsed[1], callback, context);
		}
	}, getShortcutFromKeyevent = function (e) {
		var parsed = parseKeyevent(e);
		if (parsed[0] && parsed[1].length) {
			return assembleShortcut(parsed[0], parsed[1]);
		}
	}, normalizeShortcut = function (shortcut, specialDelimiter) {
		var parsed = parseShortcut(shortcut, specialDelimiter), mainKey, modifiers;
		if (parsed) {
			mainKey = parsed[0];
			modifiers = _.map(parsed[1].sort(), function (v) {return v.toLowerCase()});

			if (_.isString(mainKey)) {
				mainKey = getCharCodesFromString(mainKey)[0];
			} // mainKey is a number or undefined

			if (mainKey && (mainKey = getStringFromCharCode(mainKey))) {
				// mainKey is definitively a not-empty string now
				return assembleShortcut(mainKey, modifiers, specialDelimiter);
			}
		}
	}


	/*
	 * This block of functions is for the time when the user is working with the web app:
	 */

	var invokeListeners = function (listenerArray, e) {
		var args = slice.call(arguments, 1), shouldApply = args.length > 1;
		_.each(listenerArray, function (listener) {
			if (shouldApply) {
				listener.callback.apply(listener.context, args);
			} else {
				listener.callback.call(listener.context, e);
			}
		})
	}, checkForKeybinding = function (e) {
		var type = e.type === "keydown" ? "key" : "char",
			code = e[type + "Code"],
			keybindings = codeBindings[type],
			modifierString = "";
		console.log(e.type, e.charCode, code, keybindings);
		if (code in keybindings) {
			_.each(modifierNames, function (name) {
				if (e[name + "Key"]) {
					modifierString += name;
				}
			});

			if (modifierString && (bindings = keybindings[code][modifierString])) {
				invokeListeners(bindings, e);
			}
		}
	};

	/*
	 * This block of functions is the public API:
	 */

	$.Keybinding = {
		on: function (shortcut, specialDelimiter, callback, context) {
			if (_.isFunction(specialDelimiter)) {
				context = callback;
				callback = specialDelimiter;
				specialDelimiter = undefined;
			}
			var keys = parseShortcut(shortcut, specialDelimiter);
			if (keys) {
				return registerListener(keys[0], keys[1], callback, context);
			}
			return false;
		},
		off: function (shortcut, specialDelimiter, callback) {
			if (_.isFunction(specialDelimiter)) {
				callback = specialDelimiter;
				specialDelimiter = undefined;
			}
			var keys = parseShortcut(shortcut, specialDelimiter);
			if (keys) {
				return unregisterListener(keys[0], keys[1], callback);
			}
			return false;
		},
		trigger: function (shortcut, specialDelimiter) {
			var keys = parseShortcut(shortcut, specialDelimiter), bindings, modifiedBindings, args = slice.call(arguments, 1);
			if (keys && (bindings = keybindings[keys[0]]) && (modifiedBindings = bindings[keys[1].sort().join(modifierStringDelimiter)])) {
				invokeListeners.apply(null, args);
			}
		},
		getKeybindingList: function () {
			var list = [], alreadyInList = {}, str, mainKey, modifiers, shortcut;
			_.each(keybindings, function (bindings, charCode) {
				str = fromCharCode(charCode);
				if (!(str in alreadyInList)) {
					alreadyInList[str.toLowerCase()] = alreadyInList[str.toUpperCase()] = true;
					mainKey = getStringFromCharCode(charCode);

					_.each(bindings, function (modifiedBindings, modifierString) {
						modifiers = modifierString.split(modifierStringDelimiter);
						shortcut = assembleShortcut(mainKey, modifiers);

						_.each(modifiedBindings, function (listener) {
							list.push(_.extend({
								shortcut: shortcut
							}, listener));
						})
					})
				}
			})
			return list;
		},
		getShortcutFromKeyevent: getShortcutFromKeyevent,
		getKeybindingFromKeyevent: getKeybindingFromKeyevent,
		normalizeShortcut: normalizeShortcut,
		options: globalOptions
	}

	$(win).on("keydown", checkForKeybinding).on("keypress", checkForKeybinding);
})(window, window.document, window.jQuery, window._);