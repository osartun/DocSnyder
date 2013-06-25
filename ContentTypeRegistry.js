(function (win, doc, $, _, Backbone, root) {

	var BackboneModelProto = Backbone.Model.prototype,
	ContentPrototype = Backbone.Model.extend({
		name: null,
		view: Backbone.View,
		model: Backbone.Model,
		setupContent: function (modelAttr, viewAttr) {
			var model = new this.model(modelAttr);
			(viewAttr || (viewAttr = {})).model = model;
			this.set({
				"view": new this.view(viewAttr),
				"model": model
			});
		},
		validate: function (attr) {
			if (!(attr.model instanceof Backbone.Model)) {
				return "model must inherit from Backbone.Model";
			}
			if (!(attr.view instanceof Backbone.View)) {
				return "view must inherit from Backbone.View";
			}
		},
		getView: function () {
			return this.get("view");
		},
		getModel: function () {
			return this.get("model");
		},
		destroy: function (options) {
			BackboneModelProto.destroy.call(this.getModel(), options);
			return BackboneModelProto.destroy.call(this, options);
		},
		exportHTML: function () {
			return this.getView().exportHTML();
		}
	}),
	ContenttypeRegistry = Backbone.Model.extend({
		validateView: function (view, model) {
			return !!(view.el && view.el.nodeName && view.model === model);
		},
		register: function (constructor) {
			try {
				var sampleContent = new constructor,
				name = sampleContent.name,

				// Test, if we can get the model
				model = sampleContent.getModel(),

				// and the view
				view = sampleContent.getView(),

				// Validate the view
				isValidView = this.validateView(view, model),

				// Check if everything gets destroyed, when we destroy the thing
				nrOfDestroyTriggers = 0,
				increse = function () {nrOfDestroyTriggers++;};

				model.once("destroy", increse);
				sampleContent.once("destroy", increse);
				sampleContent.destroy();

				// Check the results and set the constructor if everything's correct
				if (isValidView && nrOfDestroyTriggers === 2 && _.isString(name)) {
					return this.set(name, constructor);
				}
			} catch (e) {
				return false;
			}
		},
		isContenttypeAvailable: function (type) {
			return type in this.attributes;
		},
		getContentPrototype: function (type) {
			if (type) {
				return this.get(type);
			}
			return ContentPrototype;
		},
		define: function (name, Model, View, initialize, register) {
			if (typeof initialize === "boolean") {
				register = initialize;
				initialize = undefined;
			}
			var Contenttype = ContentPrototype.extend({
				name: name,
				view: View,
				model: Model,
				type: name,
				initialize: initialize ? initialize : function (attr) {
					this.setupContent(attr);
				}
			});
			if (register) {
				return this.register(Contenttype);
			}
			return Contenttype;
		}
	})

	root.supply({"ContenttypeRegistry": new ContenttypeRegistry});

})(window, document, window.jQuery, window._, window.Backbone, window.ds);