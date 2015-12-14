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
			link._ui = _s.line(link.source.x, link.source.y, link.target.x, link.target.y);
			link._ui.attr({
				stroke: '#333'
			});

			link.source._link = link;
			link.target._link = link;
		});
	}

	function rect(node) {
		node._ui = _s.rect(node.x, node.y, node.width, node.height);
		node._ui.attr({
			'fill': node.color
		});
	}

	function circle(node) {
		node._ui = _s.circle(node.x, node.y, node.r);
		node._ui.attr({
			'fill': node.color
		});
	}

	function draggable(node) {
		node._ui.drag(function(dx, dy, x, y) {
			this.attr({
				transform: this.data('transform') + (this.data('transform') ? 'T' : 't') + [dx, dy]
			});

			node.x = x;
			node.y = y;

			if (node._link.source === node) {
				node._link._ui.attr({
					x1: node.x,
					y1: node.y
				});
			} else if (node._link.target === node) {
				node._link._ui.attr({
					x2: node.x,
					y2: node.y
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