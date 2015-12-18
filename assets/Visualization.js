var Visualization = (function() {
	'use strict';

	var _nodes;

	var _links;

	var _frequencies = [];

	var _s;

	function injectLinks() {
		_links.forEach(function(link) {
			link._ui = _s.line(
				0, 0, 0, 0
			);

			link._ui.attr({
				stroke: '#333'
			});

			if (!!link.source._links) {
				link.source._links.push(link);
			} else {
				link.source._links = [link];
			}

			if (!!link.target._links) {
				link.target._links.push(link);
			} else {
				link.target._links = [link];
			}
		});
	}

	function placeLinks() {
		_links.forEach(function(link) {
			link._ui.attr({
				x1: link.source._ui.getBBox().cx,
				x2: link.target._ui.getBBox().cx,
				y1: link.source._ui.getBBox().cy,
				y2: link.target._ui.getBBox().cy
			});
		});
	}

	function createNodes() {
		_nodes.forEach(function(node) {
			//node._links = [];
			if ('frequency' === node.type) {
				_frequencies.push(node);
				circle(node);
			} else if ('attribute' === node.type) {
				rect(node);
			}

			draggable(node);
		});
	}

	function start(s, nodes, links) {
		_s = s;
		_nodes = nodes;
		_links = links;

		injectLinks();

		createNodes();

		placeLinks();
	}

	function rect(node) {
		node._ui = _s.rect(node.x, node.y, 120, 45);
		node._ui.attr({
			'fill': '#e74c3c'
		});
	}

	function circle(node) {
		var r = Math.pow(node.intervals[0].percentage, 4) / 30;
		node._ui = _s.circle(node.x, node.y, r);
		node._ui.attr({
			'fill': '#3498db'
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

	function hideSubgraph(frequency) {
		frequency._ui.animate({
			opacity: 0
		}, 1000, mina.easeinout);

		frequency._links.forEach(function(link) {
			if (link.target.numberOfLinks === 1) {
				link.target._ui.animate({
					opacity: 0
				}, 1000, mina.easeinout);

				link.target.numberOfLinks--;
			}

			link._ui.animate({
				opacity: 0
			}, 1000, mina.easeinout);
		});
	}

	function showSubgraph(frequency) {
		frequency._ui.animate({
			opacity: 1
		}, 1000, mina.easeinout);

		frequency._links.forEach(function(link) {
			if (link.target.numberOfLinks === 0) {
				link.target._ui.animate({
					opacity: 1
				}, 1000, mina.easeinout);

				link.target.numberOfLinks++;
			}

			link._ui.animate({
				opacity: 1
			}, 1000, mina.easeinout);
		})
	}

	function step(step, threshold) {
		_frequencies.forEach(function(frequency) {
			var intervals = frequency.intervals;

			if (!!intervals[step]) {

				if (intervals[step].percentage < threshold) {
					hideSubgraph(frequency);

				} else {
					showSubgraph(frequency);
				}
			}
		});
	}

	return {
		start: start,
		step: step
	};
})();