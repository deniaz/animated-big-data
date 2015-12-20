/**
 * Controls Module
 *
 * Controls using the Revealing Module Pattern.
 *
 * This module is responsible for the Animation Control son the left-hand side.
 */
var Controls = (function() {
	'use strict';

	/**
	 * Adds Event Listener.
	 *
	 * @param selector
	 * @param event
	 * @param callback
	 */
	function addEventListener(selector, event, callback) {
		document.querySelector(selector).addEventListener(event, callback);
	}

	/**
	 * Toggles the Play buttons icon.
	 */
	function togglePlayIcon() {
		var labelEl = document.querySelector('.js-play-label'),
			altText = labelEl.getAttribute('data-alt-text');

		labelEl.setAttribute('data-alt-text', labelEl.textContent);
		labelEl.textContent = altText;

		var buttonEl = document.querySelector('.js-play'),
			altSymbol = buttonEl.getAttribute('data-alt-symbol');

		buttonEl.setAttribute('data-alt-symbol', buttonEl.getAttribute('value'));
		buttonEl.setAttribute('value', altSymbol);
	}

	/**
	 * Adds the controls event listeners.
	 * @param graph
	 */
	function start(graph) {
		document.addEventListener('animation.finished', togglePlayIcon);

		addEventListener('.js-play', 'click', function() {
			togglePlayIcon();

			if (graph.isPlaying()) {
				graph.pause();
			} else {
				graph.play();
			}
		});

		addEventListener('.js-velocity', 'change', function(e) {
			var labelEl = document.querySelector('.js-velocity-label');
			labelEl.textContent = e.target.value;
			graph.changeVelocity(e.target.value);
		});

		addEventListener('.js-threshold', 'change', function(e) {
			var labelEl = document.querySelector('.js-threshold-label');
			labelEl.textContent = e.target.value;
			graph.setThreshold(e.target.value);
		});
	}

	/**
	 * Returns the module's public methods.
	 */
	return {
		start: start
	};
})();