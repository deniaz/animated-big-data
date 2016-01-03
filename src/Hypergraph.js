/**
 * Hypergraph Module.
 *
 * Hypergraph using the Revealing Module Pattern.
 *
 * This module controls the data flow through all components.
 */
var Hypergraph = (function(layoutEngine) {
	'use strict';

	/**
	 * Whether the animation is playing.
	 *
	 * @type {boolean}
	 * @private
	 */
	var _isPlaying = false;

	/**
	 * The animations interval.
	 *
	 * @type {number}
	 * @private
	 */
	var _velocity = 2500;

	/**
	 * The lower threshold to display/hide subgraphs.
	 *
	 * @type {number}
	 * @private
	 */
	var _threshold = 5.00;

	/**
	 * If an animation is in progress, this is the current interval.
	 *
	 * @type {number}
	 * @private
	 */
	var _currentInterval = 0;

	/**
	 * Interval ID which can be used to clear the interval.
	 *
	 * @type {number}
	 * @private
	 */
	var _interval = null;

	/**
	 * This is the maximum number of intervals in the animation.
	 *
	 * @type {number}
	 * @private
	 */
	var _noOfIntervals = 0;

	/**
	 * LayoutEngine.
	 *
	 * @type {LayoutEngine}
	 * @private
	 */
	var _layoutEngine = layoutEngine;

	/**
	 * Visualization.
	 *
	 * @type {Visualization}
	 */
	var _visualization;

	/**
	 * Container DOM Node.
	 *
	 * @type Element
	 * @private
	 */
	var _container = null;

	/**
	 * Calculated canvas height.
	 * @type {number}
	 * @private
	 */
	var _height = 0;

	/**
	 * Calculated canvas width.
	 * @type {number}
	 * @private
	 */
	var _width = 0;

	/**
	 * Loads JSON
	 */
	function load(file) {

		if (!file) {
			file = 'data.json';
		}

		var xhr = new XMLHttpRequest();
		xhr.open('GET', file, true);

		xhr.onload = function() {
			if (this.status >= 200 && this.status < 400) {
				var data = JSON.parse(this.response);

				data.forEach(function(subgraph) {
					var frequency = subgraph[subgraph.length-1];
					_noOfIntervals = frequency.intervals.length > _noOfIntervals ? frequency.intervals.length-1 : _noOfIntervals;
				});

				_layoutEngine.buildFromArray(data, _width, _height, function(n) {
<<<<<<< HEAD
				    //return n * 3;
				    return Math.pow(n, 2);
=======
					return n * 2;
>>>>>>> 3463009d76ad58857e4669ad816e7cac52d7ac3f
				});
				draw();
			}
		};

		xhr.send();
	}

	/**
	 * Draws SVG Element and invokes the Visualization.
	 */
	function draw() {
		var nodes = _layoutEngine.getNodes();
		var links = _layoutEngine.getLinks();

		var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		svg.setAttribute('height', _height);
		svg.setAttribute('width', _width);

		_container.appendChild(svg);

		_visualization = Visualization;
<<<<<<< HEAD
		_visualization.start(new Snap(svg), nodes, links, function(n) {
		    //return Math.pow(n, 2) * 1.5;
		    return Math.pow(n, 2);
=======
		_visualization.start({
			paper: new Snap(svg),
			nodes: nodes,
			links: links,
			normalize: function(n) { return Math.pow(n, 2) * 1.5; },
			threshold: _threshold
>>>>>>> 3463009d76ad58857e4669ad816e7cac52d7ac3f
		});
	}

	/**
	 * Starts the animation.
	 */
	function play() {
		if (!_isPlaying) {
			_isPlaying = !_isPlaying;

			_interval = window.setInterval(animationStep, _velocity);
		}
	}

	/**
	 * Pauses the animation.
	 */
	function pause() {
		if (_isPlaying) {
			_isPlaying = !_isPlaying;

			window.clearInterval(_interval);
			_interval = null;
		}
	}

	/**
	 * Sets a new velocity and restarts animation interval if in progress.
	 *
	 * @param velocity
	 * @returns {number}
	 */
	function changeVelocity(velocity) {
		_velocity = velocity;

		if (_isPlaying) {
			pause();
			play();
		}

		return _velocity;
	}

	/**
	 * An animation step is called on each animation interval.
	 */
	function animationStep() {
		if (_currentInterval === _noOfIntervals) {
			document.dispatchEvent(new Event('animation.finished'));
			window.clearInterval(_interval);
			_currentInterval = 0;
			_isPlaying = false;
			_visualization.next(_currentInterval);
		} else {
			_visualization.next(++_currentInterval);
		}
	}

	return {
		/**
		 * Assigns initial values to variables and starts loading data.
		 *
		 * @param el
		 * @param file
		 */
		start: function(el, file) {
			_container = document.querySelector(el);
			_height = window.innerHeight;
			_width = _container.offsetWidth;
			load(file);
		},
		/**
		 * Returns whether the animation is currently playing.
		 * @returns {boolean}
		 */
		isPlaying: function() { return _isPlaying; },
		play: play,
		pause: pause,
		changeVelocity: changeVelocity,
		/**
		 * Setter for the Threshold.
		 *
		 * @param threshold
		 * @returns {*}
		 */
		setThreshold: function(threshold) { _threshold = threshold; _visualization.setThreshold(threshold); }
	};
})(LayoutEngine);