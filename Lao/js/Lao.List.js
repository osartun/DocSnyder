(function (win, doc, Backbone, _, $, Lao) {

	var run = 0;

	var Base = Lao.get("Component"),
	ListItem = Base.extend({
		template: "<li><!-- Lao:Appendpoint --></li>",
		className: "LaoListItem"
	}),
	List = Base.extend({
		template: "<ul><!-- Lao:Appendpoint --></ul>",
		listItem: ListItem,
		className: "LaoList",
		listManipAdd: function (model, collection, options) {
			var appendPoint = this.getAppendPoints().eq(0),
				siblings = appendPoint.siblings();
			(siblings.length ? siblings.last() : appendPoint).after(new this.listItem({model: model}));
		},
		listManipRemoveItem: function (index) {
			var children = this.getAppendPoints(0).nextAll(), elem, LaoInst, i,l;
			if (_.isNumber(index)) {
				elem = children.eq(index),
				LaoInst = elem.getLao();
				LaoInst.remove();
			} else if (_.isArray(index)) {
				for (i = 0, l = index.length; i < l; i++) {
					elem = children.eq(index),
					LaoInst = elem.getLao();
					LaoInst.remove();
				}
			}
		},
		listManipRemove: function (model, collection, options) {
			if ("index" in options) {
				this.listManipRemoveItem(options.index);
			}
		},
		listManipReset: function (collection, options) {
			var from = 0, until = this.children().length - 1;
			this.listManipRemoveItem(_.range(until))
			collection.each(this.listManipAdd, this);
		},
		listManipSort: function (collection, options) {
			var children = this.children();
		},
		initialize: function (attr) {
			this.items = [];
			if (this.collection) {

				if (this.collection.length) {
					this.collection.each(this.listManipAdd, this);
				}

				this.collection
				.on("add", this.listManipAdd, this)
				.on("remove", this.listManipRemove, this)
				.on("reset", this.listManipReset, this)
				.on("sort", this.listManipSort, this)
			}
		}
	});

	Lao.define({
		"ListItem": ListItem,
		"List": List
	});

})(window, window.document, window.Backbone, window._, window.jQuery, window.Lao);