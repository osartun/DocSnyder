_.mixin({
	capitalize: function(string) {
		return string.charAt(0).toUpperCase() + string.substring(1);
	},
	isNumber: function (nr) {
		return typeof nr === "number" && !isNaN(nr);
	},
	isJQuery: function (o) {
		return jQuery && o instanceof jQuery;
	},
	testPerformance: function(fn, duration) {
		_.isNumber(duration) || (duration = 1000);
		var end = Date.now() + duration, i = 0;
		while (Date.now() < end) {
			fn();
			i++;
		}
		return i;
	},
	performanceAverage: function (fn, duration, nrOfTimes) {
		_.isNumber(nrOfTimes) && nrOfTimes > 0 || (nrOfTimes = 10);
		var i = 0, a = [];
		while (i++ < nrOfTimes)
			a.push(_.testPerformance(fn, duration));
		return _.reduce(a, function (sum, num) {return sum + num;}, 0) / nrOfTimes;
	},
	getPerformanceRatio: (function () {
		var optimum;
		return function (fn) {
			return (optimum || (optimum = _.performanceAverage($.noop, 100))) && _.performanceAverage(fn, 100) * 100 / optimum;
		}
	})()
});

_.each("Function String Number Date RegExp".split(" "), function(name) {
	_["are" + name + "s"] = function () {
		return _.all(_.toArray(arguments), _["is" + name]);
	}
});