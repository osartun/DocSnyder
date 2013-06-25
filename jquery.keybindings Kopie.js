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
		fromCharCode = String.fromCharCode;

	var Constants = {
		"BACKSPACE": 8,
		"TAB": 9,
		"RETURN": 13,
		"ESCAPE": 27,
		"SPACE": 32,
		"PAGE_UP": 33,
		"PAGE_DOWN": 34,
		"LEFT": 37,
		"UP": 38,
		"RIGHT": 39,
		"DOWN": 40
	},
	getCharCodeFromConstant,
	getConstantFromCharCode,
	prefix, r_prefix,
	isPrintableMap = {},
	checkForPrintability = (function (testEl, textNode, body, r_whitespace) {
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
	})(doc.createElement("div"), doc.createTextNode(""), doc.body, /^[\s\t\r\n ]+$/),
	isPrintableCharacter = function (charCode) {
		var str = fromCharCode(charCode);
		return (str in isPrintableMap ? isPrintableMap[str] : checkForPrintability(str));
	};

	if (win.KeyEvent) {
		prefix = "DOM_VK_";
		r_prefix = new RegExp("^" + prefix);

		getCharCodeFromConstant = function (constant) {
			return win.KeyEvent[prefix + constant];
		};
		getConstantFromCharCode = function (charCode) {
			if (typeof charCode !== "number") return;

			var name, obj = win.KeyEvent;
			for (name in obj) {
				if (obj[name] === charCode) {
					return r_prefix.test(name) ? name.substr(prefix.length) : name;
				}
			}
		}
	} else {
		getCharCodeFromConstant = function (constant) {
			return Constants[constant];
		};
		getConstantFromCharCode = function (charCode) {
			if (typeof charCode !== "number") return;

			for (var name in Constants) {
				if (Constants[name] === charCode) {
					return name;
				}
			}
		}
	}

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

	var keybindings = {},
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

	var detectAllCharCodes = function (charCode) {
		if (_.isString(charCode)) {
			return getCharCodesFromString(charCode);
		} else if (_.isNumber(charCode)) {
			return [parseInt(charCode)];
		}
	}, registerListener = function (charCode, arrayOfModifiers, callback, context) {
		var ret = false, stringOfModifiers, bindings, modifiedBindings;
		if (charCode && arrayOfModifiers && _.isArray(arrayOfModifiers) && arrayOfModifiers.length && callback) {
			stringOfModifiers = arrayOfModifiers.sort().join(modifierStringDelimiter);

			charCode = detectAllCharCodes(charCode);

			_.each(charCode, function (code) {
				if (code) {
					ret = true;
					bindings = keybindings[code] || (keybindings[code] = {}),
					modifiedBindings = bindings[stringOfModifiers] || (bindings[stringOfModifiers] = []);

					modifiedBindings.push({
						"callback": callback,
						"context": context
					})
				}
			})
		}
		return ret;
	}, unregisterListener = function (charCode, arrayOfModifiers, callback) {
		var ret = false, stringOfModifiers, bindings, modifiedBindings, i,l, listener;
		if (charCode && arrayOfModifiers && _.isArray(arrayOfModifiers) && arrayOfModifiers.length) {
			stringOfModifiers = arrayOfModifiers.sort().join(modifierStringDelimiter);

			charCode = detectAllCharCodes(charCode);

			if (!callback) {
				_.each(charCode, function (code) {
					if (code && (bindings = keybindings[code])) {
						ret = true;
						delete bindings[stringOfModifiers];
					}
				})
			} else {
				_.each(charCode, function (code) {
					if (code && (bindings = keybindings[code]) && (modifiedBindings = bindings[stringOfModifiers])) {

						for (i = 0, l = modifiedBindings.length; (listener = modifiedBindings[i]); i++) {
							if (listener.callback === callback) {
								ret = true;
								modifiedBindings.splice(i, 1);
								break;
							}
						};
					}
				})
			}
		}
		return ret;
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
					if (!isNaN(parseInt(key))) {
						mainKey.push(parseInt(key));
					} else {
						mainKey.push(key.toUpperCase());
					}
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
		if (e.charCode in keybindings && currentlyPressedModifiers.length) {
			var charCode = e.charCode, modifierStr = currentlyPressedModifiers.join(modifierStringDelimiter), bindings;
			if (bindings = keybindings[charCode][modifierStr]) {
				invokeListeners(bindings, e);
			}
		}
	}, registerModifiers = function (e) {
		var oneOrMoreModifiersArePressed = e.altKey || e.ctrlKey || e.metaKey || e.shiftKey;
		if (!currentlyPressedModifiers.length && oneOrMoreModifiersArePressed) {
			_.each(modifierNames, function (name) {
				if (e[name + "Key"]) {
					currentlyPressedModifiers.push(name);
				}
			});
		} else if (currentlyPressedModifiers.length && !oneOrMoreModifiersArePressed) {
			currentlyPressedModifiers = [];
		}
	}

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

	$(win).on("keydown", registerModifiers).on("keypress", checkForKeybinding);
})(window, window.document, window.jQuery, window._);