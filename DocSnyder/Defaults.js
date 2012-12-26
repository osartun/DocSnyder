(function (win, doc, $, root) {
	root.Defaults = {
		Document: {
			title: root.LanguagePack.DEFAULT_TITLE,
			width: 640,
			height: 480
		},
		Page: {
			marginTop: 0,
			marginRight: 0,
			marginBottom: 0,
			marginLeft: 0
		},
		Item: {
			x: 0,
			y: 0,
			width: 0,
			height: 0,
			rotation: 0,
			locked: false
		}
	}
})(window, document, jQuery, docSnyder);