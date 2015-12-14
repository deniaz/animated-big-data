var Hypergraph = (function(builder) {

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
	var _threshold = 6.25;

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

	var _graphBuilder = null;

	/**
	 * Loads JSON
	 */
	function load() {
		var xhr = new XMLHttpRequest();
		xhr.open('GET', 'data_arr.json', true);

		xhr.onload = function() {
			if (this.status >= 200 && this.status < 400) {
				var data = JSON.parse(this.response);

				data.forEach(function(subgraph) {
					var frequency = subgraph[subgraph.length - 1];;
					_noOfIntervals = frequency.intervals.length > _noOfIntervals ? frequency.intervals.length : _noOfIntervals;
				});

				_graphBuilder.buildFromArray(data);
				draw();
			}
		};

		xhr.send();
	}

	function draw() {
		var nodes = _graphBuilder.getNodes();
		var links = _graphBuilder.getLinks();
	}

	/**
	 * Starts the animation.
	 */
	function play() {
		if (!_isPlaying) {
			_isPlaying = !_isPlaying;

			_interval = window.setInterval(function() { console.info('Interval Step! ' + _velocity); }, _velocity);
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
		}

		play();

		return _velocity;
	}

	return {
		start: load,
		isPlaying: function() { return _isPlaying; },
		play: play,
		pause: pause,
		changeVelocity: changeVelocity,
		setThreshold: function(threshold) { return _threshold = threshold; }
	}
})(GraphBuilder);