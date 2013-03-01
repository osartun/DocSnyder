(function (global, Backbone, _, $) {
	if (!global || !Backbone || !_ || !$) return;

	var dependecyQueue = [];

	function waitingForDependency (dependencies, callback, context) {
		dependecyQueue.push([dependencies, callback, context]);
	}
	function checkForAvailableDependencies() {
		var ds = global.ds, i = 0, q = dependecyQueue, l = q.length, dependencies, d, callback, context, j, k;
		for (; i < l; i++) {
			if (!q[i]) continue;

			dependencies = q[i][0], callback = q[i][1], context = q[i][2];
			// Check if all dependencies are available now
			for (j=0, k=dependencies.length; d=dependencies[j], j<k; j++) {
				if (ds[d] === undefined) { // Nope, at least this one is not
					break; // Look no further
				} else if (j === k - 1) {
					// Ok, we've reached the end of the loop without getting thrown out
					// that means: voilá all dependencies are available
					delete q[i]; // We've done our bit, no need to call the callback again
					callback.call(context);
				}
			}
		}
	}

	global.ds && global.ds.demand && global.ds.supply || (global.ds = {
		demand: function (dependencies, callback, context) {
			_.isArray(dependencies) || (dependencies = [dependencies]);
			if (dependencies.length && typeof dependencies[0] === "string" && typeof callback === "function") {
				waitingForDependency(dependencies, callback, context);
				checkForAvailableDependencies();
			}
		},
		supply: function (obj) {
			_.extend(global.ds, obj);
			checkForAvailableDependencies();
		}
	});

})(this, Backbone, _, jQuery);