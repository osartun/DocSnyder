(function (global, Backbone, _, $) {
	if (!global || !Backbone || !_ || !$) return;

	var dependecyQueue = [];

	function waitingForDependency (dependencies, callback) {
		dependecyQueue.push([dependencies, callback]);
	}
	function checkForAvailableDependencies() {
		var ds=global.ds, i=0, q=dependecyQueue, l=q.length, dependencies, d, callback, j;
		for (; i < l; i++) {
			if (!q[i]) continue;

			dependencies = q[i][0], callback = q[i][1];
			// Check if all dependencies are available now
			for (j=0; d=dependencies[j], j<dependencies.length; j++) {
				if (ds[d] === undefined) { // Nope, at least this one is not
					break; // Look no further
				} else if (j === dependencies.length - 1) {
					// Ok, we've reached the end of the loop without getting thrown out
					// that means: voilá all dependencies are available
					delete q[i]; // We've done our bit, no need to call the callback again
					callback();
				}
			}
		}
	}

	global.ds && global.ds.demand && global.ds.supply || (global.ds = {
		demand: function (dependencies, callback) {
			_.isArray(dependencies) || (dependencies = [dependencies]);
			if (dependencies.length && typeof dependencies[0] === "string" && typeof callback === "function") {
				waitingForDependency(dependencies, callback);
				checkForAvailableDependencies();
			}
		},
		supply: function (obj) {
			_.extend(global.ds, obj);
			checkForAvailableDependencies();
		}
	});

})(this, Backbone, _, jQuery);