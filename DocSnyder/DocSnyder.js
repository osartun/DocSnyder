/**
 * The Main Function. Everything starts here.
 */
(function (root) {
	if (!root.jQuery || !root.Backbone || !root._) {
		return "Dependencies not found";
	}
	if (!root.Docsnyder) {
		var scripts = [], base = "", doc = document;
		function addScript(source) {
			scripts.push(base + source);
		}

		// docsnyder.core.*
		addScript("core/i18nManager.js");
		addScript("core/UndoManager.js");
		addScript("core/Editor.js");
		addScript("core/EventProcessor.js");
		addScript("core/LayoutManager.js");
		addScript("core/MenuManager.js");

		// docsnyder.module.*
		addScript("modules/LayoutModule.js");
		addScript("modules/Toolbar.js");
		addScript("module/ObjectType.js");

		// docsnyder.canvas.*
		addScript("modules/Canvas.js");

		function loadScripts() {
			for (var i=0; i<scripts.length; i++) {
				doc.write("<script src='"+scripts[i]+"'></script>");
			}
		}
		setTimeout(loadScripts, 0);
	}

	root.DocSnyder = function() {};

})(window);