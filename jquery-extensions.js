(function ($, document, undefined) {
	$.extend({
		/**
		 * A static jQuery-method that retrieves the stack of all elements from one point.
		 * @param {number} x The x-coordinate of the Point.
		 * @param {number} y The y-coordinate of the Point.
		 * @param {Element} until (optional) The element at which traversing should stop. Default is document.body
		 * @return {jQuery} A set of all elements visible at the given point.
		 */
		elementsFromPoint: function(x,y, until) {
			until || (until = document.body); // Stop traversing here
			if (until instanceof $) until = until[0];

			var elements = [], previousDisplay = [], current, i, d;
			//console.log(document.elementFromPoint(x,y))
			while ( (current = document.elementFromPoint(x,y)) && current != null 
				&& current !== until // Stop, when we reached until
				&& current !== elements[elements.length - 1]) { // prevent infinite loops
				elements.push(current);
				previousDisplay.push(current.style.display); // Save the current display-inline-style to restore it afterwards
				current.style.display = "none"; // Add display: none, to get to the underlying element
			}

			i = previousDisplay.length;
			while ((d = previousDisplay.pop()) != null && i--) {
				elements[i].style.display = d; // Restore the previous display-value
			}
			return $(elements);
		}
	});

	$.fn.contains = function (element) {
		return element && this.index(element) > -1;
	};

	$.fn.resetStyles = function (originalStyles) {
		return this.each(function () {
			var style = this.style, i, l, $this = $(this);
			for (i = 0, l=style.length; i < l; i++) {
				$this.css(style[i], originalStyles ? style[style[i]] : $this.css(style[i]));
			}
		});
	}
})(window.jQuery, window.document);

window.requestAnimationFrame || (window.requestAnimationFrame = (function(){
      return  window.requestAnimationFrame       || 
              window.webkitRequestAnimationFrame || 
              window.mozRequestAnimationFrame    || 
              window.oRequestAnimationFrame      || 
              window.msRequestAnimationFrame     || 
              function( callback ){
                window.setTimeout(callback, 1000 / 60);
              };
    })());