(function(root, Backbone, _) {
	var UndoManager = Backbone.Model.extend({
		initialize: function () {
			this._undoStack = [];
			this._redoStack = [];

			this.registeredObjects = [];

			this.eventToUndoMap = {
				"add": "remove",
				"change": "set",
				"remove": "add"
			};

			this.undoRedoToEventMap = {
				"remove": "add",
				"set": "change",
				"add": "remove"
			};

			this.undoRedoMap = {
				"add": "remove",
				"set": "set",
				"remove": "add",
			}
		},
		_addUndo: function (event, obj, now, before) {
			var undoStackLength = this._undoStack.length, lastUndo = this._undoStack[--undoStackLength], redoEvent, undoEvent, undoFn, redoFn;
			if (!lastUndo || lastUndo.obj !== obj || !_.isEqual(lastUndo.data, before)) {
				// Ok, this is not a bubbling Event, but an actual new one
				this._redoStack = []; // This is also not an undone redo, so empty the redo stack

				undoFn = this.eventToUndoMap[event];
				redoFn = this.undoRedoMap[undoFn];

				redoEvent = this.undoRedoToEventMap[redoFn];
				undoEvent = this.undoRedoToEventMap[undoFn];

				this._undoStack.push({
					obj: obj,
					undo: obj[undoFn],
					redo: obj[redoFn],
					data: before,
					ignoreNextEvent: {
						undo: undoEvent,
						redo: redoEvent
					}
				});
			}
		},
		redoIsPossible: function () {
			return !!this._redoStack.length;
		},
		undoIsPossible: function () {
			return !!this._undoStack.length;
		},
		undo: function () {
			if (this.undoIsPossible()) {
				var undo = this._undoStack.pop();
				this._redoStack.unshift(undo);
				this.ignoreNextEvent = undo.ignoreNextEvent.undo;
				undo.undo.call(undo.obj, undo.data);
			}
		},
		redo: function () {
			if (this.redoIsPossible()) {
				var redo = this._redoStack.shift();
				this._undoStack.push(redo);
				this.ignoreNextEvent = redo.ignoreNextEvent.redo;
				redo.redo.call(redo.obj, redo.data);
			}
		},
		_addListeners: function (obj) {
			obj.on("all", function (event, m, c) {
				if (event === this.ignoreNextEvent) {
					return this.ignoreNextEvent = undefined;
				} else {
					var args = [event];
					switch (event) {
						case "change": args.push(m, _.clone(m.attributes), m.previousAttributes()); break;
						case "add": args.push(c,m,m); break;
						case "remove": args.push(c,m,m); break;
						default: return;
					}
					this._addUndo.apply(this, args);
				}
			}, this);
		},
		_stackToString: function (stack) {
			var arr = [], obj;
			_.each(stack, function(ur) {
				obj = ur.data.get ? ur.data : ur.obj;
				arr.push(ur.ignoreNextEvent.undo + ":" + (obj.get("itemId") || obj.get("id")).substr(10));
			});
			return "[" + arr.join(", ") + "]";
		},
		toString: function() {
			return _.map([this._undoStack, this._redoStack], this._stackToString, this).join(" ");
		},
		register: function(obj) {
			var isModel = obj instanceof Backbone.Model, isCollection = obj instanceof Backbone.Collection;
			if (!isModel && !isCollection || _.indexOf(this.registeredObjects, obj) > -1) return;

			// is valid and not yet registered
			this.registeredObjects.push(obj); // register

			this._addListeners(obj);
		}
	});

	root.UndoManager = new UndoManager();
})(this, Backbone, _);