var Visualization = (function() {

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

			node._ui.drag(function(dx, dy) {
				this.attr({
					transform: this.data('transform') + (this.data('transform') ? 'T' : 't') + [dx, dy]
				});
			}, function() {
				this.data('transform', this.transform().local);
			});
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

	return {
		start: start
	};
})();