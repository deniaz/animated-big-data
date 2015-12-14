var Visualization = (function() {
	'use strict';

	var _nodes;

	var _links;

	var _s;

	function start(s, nodes, links) {
		_s = s;
		_nodes = nodes;
		_links = links;

		_nodes.forEach(function(node) {
			if ('frequency' === node.type) {
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

			link.source._link = link;
			link.target._link = link;
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

			if (node._link.source === node) {
				node._link._ui.attr({
					x1: boundingBox.cx,
					y1: boundingBox.cy
				});
			} else {
				node._link._ui.attr({
					x2: boundingBox.cx,
					y2: boundingBox.cy
				});
			}

		}, function() {
			this.data('transform', this.transform().local);
		});
	}

	return {
		start: start
	};
})();