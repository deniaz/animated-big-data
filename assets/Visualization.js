var Visualization = (function() {
	'use strict';

	var _nodes;

	var _links;

	var _frequencies = [];

	var _s;

	function start(s, nodes, links) {
		_s = s;
		_nodes = nodes;
		_links = links;

		_nodes.forEach(function(node) {
			node._links = [];
			if ('frequency' === node.type) {
				_frequencies.push(node);
				circle(node);
			} else if ('attribute' === node.type) {
				rect(node);
			}

			draggable(node);
		});

		_links.forEach(function(link) {
			link._ui = _s.line(
				link.source._ui.getBBox().cx,
				link.source._ui.getBBox().cy,
				link.target._ui.getBBox().cx,
				link.target._ui.getBBox().cy
			);

			link._ui.attr({
				stroke: '#333'
			});

			link.source._links.push(link);
			link.target._links.push(link);
		});
	}

	function rect(node) {
		node._ui = _s.rect(node.x, node.y, 120, 45);
		node._ui.attr({
			'fill': 'deeppink'
		});
	}

	function circle(node) {
		var r = Math.pow(node.intervals[0].percentage, 4) / 30;
		node._ui = _s.circle(node.x, node.y, r);
		node._ui.attr({
			'fill': 'deepskyblue'
		});
	}

	function draggable(node) {
		node._ui.drag(function(dx, dy, x, y) {

			this.attr({
				transform: this.data('transform') + (this.data('transform') ? 'T' : 't') + [dx, dy]
			});

			node.x = x;
			node.y = y;

			var boundingBox = node._ui.getBBox();

			node._links.forEach(function(link) {
				if (link.source === node) {
					link._ui.attr({
						x1: boundingBox.cx,
						y1: boundingBox.cy
					});
				} else if (link.target === node) {
					link._ui.attr({
						x2: boundingBox.cx,
						y2: boundingBox.cy
					});
				}
			});

		}, function() {
			this.data('transform', this.transform().local);
		});
	}

	function step(step) {
		_frequencies.forEach(function(frequency) {
			var intervals = frequency.intervals;

			if (!!intervals[step]) {

				if (intervals[step].percentage < 6) {
					frequency._ui.attr({
						opacity: 0
					});

					frequency._links.forEach(function(link) {
						if (link.target.numberOfLinks === 1) {
							link.target._ui.attr({
								opacity: 0
							});

							link.target.numberOfLinks--;
						}

						link._ui.attr({
							opacity: 0
						});
					});
				} else {
					frequency._ui.attr({
						opacity: 1
					});

					frequency._links.forEach(function(link) {
						if (link.target.numberOfLinks === 0) {
							link.target._ui.attr({
								opacity: 1
							});

							link.target.numberOfLinks++;
						}

						link._ui.attr({
							opacity: 1
						});
					})
				}
			}
		});
	}

	return {
		start: start,
		step: step
	};
})();