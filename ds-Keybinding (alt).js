(function(root, Backbone, _, $) {

    var Keycodes = {
          DOM_VK_CANCEL: 3,
          DOM_VK_HELP: 6,
          DOM_VK_BACK_SPACE: 8,
          DOM_VK_TAB: 9,
          DOM_VK_CLEAR: 12,
          DOM_VK_RETURN: 13,
          DOM_VK_ENTER: 14,
          DOM_VK_SHIFT: 16,
          DOM_VK_CONTROL: 17,
          DOM_VK_ALT: 18,
          DOM_VK_PAUSE: 19,
          DOM_VK_CAPS_LOCK: 20,
          DOM_VK_ESCAPE: 27,
          DOM_VK_SPACE: 32,
          DOM_VK_PAGE_UP: 33,
          DOM_VK_PAGE_DOWN: 34,
          DOM_VK_END: 35,
          DOM_VK_HOME: 36,
          DOM_VK_LEFT: 37,
          DOM_VK_UP: 38,
          DOM_VK_RIGHT: 39,
          DOM_VK_DOWN: 40,
          DOM_VK_SELECT: 41,
          DOM_VK_PRINT: 42,
          DOM_VK_EXECUTE: 43,
          DOM_VK_PRINTSCREEN: 44,
          DOM_VK_INSERT: 45,
          DOM_VK_DELETE: 46,
          DOM_VK_0: 48,
          DOM_VK_1: 49,
          DOM_VK_2: 50,
          DOM_VK_3: 51,
          DOM_VK_4: 52,
          DOM_VK_5: 53,
          DOM_VK_6: 54,
          DOM_VK_7: 55,
          DOM_VK_8: 56,
          DOM_VK_9: 57,
          DOM_VK_COLON: 58,
          DOM_VK_SEMICOLON: 59,
          DOM_VK_LESS_THAN: 60,
          DOM_VK_EQUALS: 61,
          DOM_VK_GREATER_THAN: 62,
          DOM_VK_QUESTION_MARK: 63,
          DOM_VK_AT: 64,
          DOM_VK_A: 65,
          DOM_VK_B: 66,
          DOM_VK_C: 67,
          DOM_VK_D: 68,
          DOM_VK_E: 69,
          DOM_VK_F: 70,
          DOM_VK_G: 71,
          DOM_VK_H: 72,
          DOM_VK_I: 73,
          DOM_VK_J: 74,
          DOM_VK_K: 75,
          DOM_VK_L: 76,
          DOM_VK_M: 77,
          DOM_VK_N: 78,
          DOM_VK_O: 79,
          DOM_VK_P: 80,
          DOM_VK_Q: 81,
          DOM_VK_R: 82,
          DOM_VK_S: 83,
          DOM_VK_T: 84,
          DOM_VK_U: 85,
          DOM_VK_V: 86,
          DOM_VK_W: 87,
          DOM_VK_X: 88,
          DOM_VK_Y: 89,
          DOM_VK_Z: 90,
          DOM_VK_CONTEXT_MENU: 93,
          DOM_VK_NUMPAD0: 96,
          DOM_VK_NUMPAD1: 97,
          DOM_VK_NUMPAD2: 98,
          DOM_VK_NUMPAD3: 99,
          DOM_VK_NUMPAD4: 100,
          DOM_VK_NUMPAD5: 101,
          DOM_VK_NUMPAD6: 102,
          DOM_VK_NUMPAD7: 103,
          DOM_VK_NUMPAD8: 104,
          DOM_VK_NUMPAD9: 105,
          DOM_VK_MULTIPLY: 106,
          DOM_VK_ADD: 107,
          DOM_VK_SEPARATOR: 108,
          DOM_VK_SUBTRACT: 109,
          DOM_VK_DECIMAL: 110,
          DOM_VK_DIVIDE: 111,
          DOM_VK_F1: 112,
          DOM_VK_F2: 113,
          DOM_VK_F3: 114,
          DOM_VK_F4: 115,
          DOM_VK_F5: 116,
          DOM_VK_F6: 117,
          DOM_VK_F7: 118,
          DOM_VK_F8: 119,
          DOM_VK_F9: 120,
          DOM_VK_F10: 121,
          DOM_VK_F11: 122,
          DOM_VK_F12: 123,
          DOM_VK_F13: 124,
          DOM_VK_F14: 125,
          DOM_VK_F15: 126,
          DOM_VK_F16: 127,
          DOM_VK_F17: 128,
          DOM_VK_F18: 129,
          DOM_VK_F19: 130,
          DOM_VK_F20: 131,
          DOM_VK_F21: 132,
          DOM_VK_F22: 133,
          DOM_VK_F23: 134,
          DOM_VK_F24: 135,
          DOM_VK_NUM_LOCK: 144,
          DOM_VK_SCROLL_LOCK: 145,
          DOM_VK_CIRCUMFLEX: 160,
          DOM_VK_EXCLAMATION: 161,
          DOM_VK_DOUBLE_QUOTE: 162,
          DOM_VK_HASH: 163,
          DOM_VK_DOLLAR: 164,
          DOM_VK_PERCENT: 165,
          DOM_VK_AMPERSAND: 166,
          DOM_VK_UNDERSCORE: 167,
          DOM_VK_OPEN_PAREN: 168,
          DOM_VK_CLOSE_PAREN: 169,
          DOM_VK_ASTERISK: 170,
          DOM_VK_PLUS: 171,
          DOM_VK_PIPE: 172,
          DOM_VK_HYPHEN_MINUS: 173,
          DOM_VK_OPEN_CURLY_BRACKET: 174,
          DOM_VK_CLOSE_CURLY_BRACKET: 175,
          DOM_VK_TILDE: 176,
          DOM_VK_COMMA: 188,
          DOM_VK_PERIOD: 190,
          DOM_VK_SLASH: 191,
          DOM_VK_BACK_QUOTE: 192,
          DOM_VK_OPEN_BRACKET: 219,
          DOM_VK_BACK_SLASH: 220,
          DOM_VK_CLOSE_BRACKET: 221,
          DOM_VK_QUOTE: 222,
          DOM_VK_META: 224,
          DOM_VK_ALTGR: 225,
          DOM_VK_WIN: 91,
          DOM_VK_KANA: 21,
          DOM_VK_HANGUL: 21,
          DOM_VK_EISU: 22,
          DOM_VK_JUNJA: 23,
          DOM_VK_FINAL: 24,
          DOM_VK_HANJA: 25,
          DOM_VK_KANJI: 25,
          DOM_VK_CONVERT: 28,
          DOM_VK_NONCONVERT: 29,
          DOM_VK_ACCEPT: 30,
          DOM_VK_MODECHANGE: 31,
          DOM_VK_SELECT: 41,
          DOM_VK_PRINT: 42,
          DOM_VK_EXECUTE: 43,
          DOM_VK_SLEEP: 95
      },
        keynamePrefix = "DOM_VK_",
        keyNamePattern = /^DOM_VK_([a-zA-Z0-9]+)/,
        keycodeNames = _.invert(Keycodes), // For fast reverse search
        likeMeta = {
            "DOM_VK_WIN": true,
            "DOM_VK_CONTROL": true,
            "DOM_VK_CONTEXT_MENU": true
        },
        keybindingInstance;

	function Keybinder() {
		this.fallbackBindings = [];
		this.KeybindingTable = {};
            this.pressedKeys = [];
            this.currentShortcut = "";

            var self = this;

            $(document).on("keydown keyup", function(e) {
                  self._keydownKeyupHandler(e.which, e.type === "keydown", e);
            });
	}

	_.extend(Keybinder.prototype, {
            _normalizeKeycode: function (keycode) {
                  return (keycode === Keycodes[keynamePrefix + "WIN"] || keycode === Keycodes[keynamePrefix + "CONTROL"]) ? Keycodes[keynamePrefix + "META"] : keycode;
            },
            _normalizeKeyname: function (keyname) {
                  keyname = keyname.trim();
                  keyNamePattern.test(keyname) || (keyname = keynamePrefix + keyname);
                  if (keyname in likeMeta) {
                        keyname = keynamePrefix + "META";
                  }
                  return keyNamePattern.test(keyname) ? keyname : "";
            },
            _validateShortcut: function (shortcut) {
                  if (typeof shortcut !== "string") return "";
                  var key, keys = shortcut.toUpperCase().split("+"), keylength = keys.length,
                  finalKeys = [];
                  while ((key = keys.shift()) != null && (key = this._normalizeKeyname(key))) {
                        if (Keycodes[key]) {
                              finalKeys.push(key);
                        }
                  }
                  finalKeys = _.uniq(finalKeys.sort(), true); // If there are double values in it, remove them
                  return (finalKeys.length === keylength) ? finalKeys.join("+") : "";
            },
            _updateCurrentShortcut: function () {
                  this.currentShortcut = this._validateShortcut(this.pressedKeys.join("+"));
            },
            _keydownKeyupHandler: function (keycode, keydown, e) {
                  var keyName, index, shortcutData;
                  keyName = keycodeNames[this._normalizeKeycode(keycode)];

                  if (keydown && keyName === _.last(this.pressedKeys)) return;

                  if (keydown) {
                        this.pressedKeys.push(keyName);
                  } else {
                        index = _.indexOf(this.pressedKeys, keyName);
                        this.pressedKeys.splice(index, 1);
                  }
                  this._updateCurrentShortcut();

                  console.log(keycode, this.getCurrentKeysAsShortcut())

                  if (keydown && (shortcutData = this.KeybindingTable[this.getCurrentKeysAsShortcut()])) {
                        console.log("Yes")
                        e.preventDefault();
                        shortcutData.callback.call(shortcutData.context);
                  }
            },
            _getShortCutByCallback: function (callback) {
                  return _.pluck(_.where(this.fallbackBindings, {"callback": callback}), "shortcut");
            },
            _getAlternativeCallbacks: function (shortcut) {
                  return _.pluck(_.where(this.fallbackBindings, {"shortcut": shortcut}), "callback");
            },
            getCurrentKeysAsShortcut: function () {
                  return this.currentShortcut;
            },
		bind: function (shortcut, callback, context, overwrite) {
			if (typeof context === "boolean") {
				overwrite = context;
				context = null;
			} else if (overwrite === undefined) {
				overwrite = true;
			}

                  context || (context = null);

			if ((shortcut = this._validateShortcut(shortcut)) && (!this.KeybindingTable[shortcut] || overwrite)) {
				this.fallbackBindings.push({
					"shortcut": shortcut,
					"callback": callback,
                              "context": context
				});
				this.KeybindingTable[shortcut] = {"callback": callback, "context": context};
			}
		},
		unbind: function (shortcutOrCallback, newCallback) {
			var shortcut = typeof shortcutOrCallback === "string" ? shortcutOrCallback : this._getShortCutByCallback(callback)[0],
				callback = typeof shortcutOrCallback === "function" ? shortcutOrCallback : this.KeybindingTable[shortcut].callback;
				newCallback = _.without(typeof newCallback === "function" ? [newCallback] : this._getAlternativeCallbacks(shortcut), callback);
			if (shortcut && callback && this.KeybindingTable[shortcut] === callback) {
				this.KeybindingTable[shortcut] = newCallback.length ? _.last(newCallback) : undefined;
			}
		},
            isKeyPressed: function (keyName) {
                  return (keyName = this._normalizeKeyname(keyName)) ? (_.indexOf(this.pressed, keyName) > -1) : false;
            }
	});

	root.Keybinder = keybindingInstance = new Keybinder();
})(this, Backbone, _, jQuery);