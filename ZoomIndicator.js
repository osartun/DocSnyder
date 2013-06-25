(function (win, doc, $, _, Backbone, root) {

	function seperateKeyValue (data) {
		var l = data.length, i, u = undefined;
		// data looks either like this: [a, b] (array case)
		// or like this: {a: b} (object case)
		if (l === +l) {
			// array case
			return {
				key: data[0],
				value: data[1] || 0 // In case of ["World"] where data[1] is undefined, value is 0
			}
		} else {
			// object case
			for (i in data) {
				if (data.hasOwnProperty(i)) {
					return {
						key: i,
						value: data[i]
					}
				}
			}
		}
		return {key: u, value: u};
	}

	function create (tagname) {
		return document.createElement(tagname);
	}
	function createOption (name, value) {
		if (typeof name === "object") {
			// Instead of createOption("Hello", "World")
			// someone called createOption({"Hello": "World"}) (object case)
			// or createOption(["Hello", "World"]); (array case)
			var data = seperateKeyValue(name);
			name = data.key;
			value = data.value;
		}
		var option = create("option"),
		innerTextAttr = "innerText" in option ? "innerText" : "textContent" in option ? "textContent" : "innerHTML";
		option.value = value;
		option[innerTextAttr] = name;
		return option;
	}
	function addOption (select, name, value, index) {
		return index !== undefined && index < select.length ?
			select.insertBefore(createOption(name, value), select[index]) :
			select.appendChild(createOption(name, value));
	}
	function removeOption (select, index) {
		return select.removeChild(select[index]);
	}
	function generateSelect (data, select) {
		_.each(data, _.partial(addOption, select));
		return select;
	}

	function findIndex (collection, value, precise) {
		for (var l = collection.length, i = 0, data; i < l; i++) {
			data = seperateKeyValue(collection[i]);
			if (precise) {
				if (data.value === value) {
					return i;
				}
			} else {
				if (data.value > value) {
					return i - 1;
				}
			}
		}
		return (!precise && value > data.value) ? i - 1 : -1;
	}

	var ZoomIndicator = Backbone.View.extend({
		tagName: "select",
		initialize: function (attr) {
			this.model.on("change", this.update, this);
			generateSelect(attr.steps, this.el);
			this.update();
		},
		update: function () {
			var zoomFactor = _.round(this.model.get("scaleX"), 2), select = this.el,
			steps = this.options.steps, index = findIndex(steps, zoomFactor, true);

			// If we've inserted a new option for custom scales before, remove it
			if (this.customOption !== undefined) {
				// this.customOption contains the index of where the customOption was inserted
				removeOption(this.el, this.customOption);
				delete this.customOption;
			}

			if (index == -1) {
				// The current scale factor isn't part of the available options
				// create a new option for it
				this.customOption = index = findIndex(steps, zoomFactor, false) + 1;
				addOption(select, ((100 * zoomFactor)|0) + "%", zoomFactor, index);
			}
			select[index].selected = true;
		},
		change: function (e) {
			var zoomFactor = e.target.value;
			this.model.setScale(+zoomFactor);
		},
		events: {
			"change": "change"
		}
	});

	root.supply({"ZoomIndicator": ZoomIndicator});
})(window, document, jQuery, _, Backbone, window.ds);