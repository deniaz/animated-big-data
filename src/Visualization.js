/**
 * Visualization Module
 *
 * Visualization using the Revealing Module Pattern.
 *
 * This component is responsible for the visualization of the graph and therefore the UI layer.
 * It depends on Snap.svg for SVG drawing.
 */
var Visualization = (function() {
	'use strict';

	/**
	 * Array containing all hypergraph nodes.
	 *
	 * @type {Array}
	 * @private
	 */
	var _nodes;

	/**
	 * Array containing all hypergraph edges/links.
	 *
	 * @type {Array}
	 * @private
	 */
	var _links;

	/**
	 * Array containing all node-text groups.
	 *
	 * @type {Array}
	 * @private
	 */
	var _groupped = [];

	/**
	 * Snap.svg instance
	 *
	 * @type {Paper}
	 * @private
	 */
	var _s;

	var _normalize;

	/**
	 * Injects all <line> Elements in the DOM without any positioning and adds relations to link objects.
	 */
	function injectLinks() {
		_links.forEach(function(link) {
			// Lines are repositioned in placeLinks(). As there is no z-index in SVG the Links need to be injected
			// before the nodes.
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

	/**
	 * Adds positioning to links based on their source/target nodes bound box values.
	 */
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

	/**
	 * Injects nodes with text labels into the DOM.
	 */
	function createNodes() {
		_nodes.forEach(function(node) {
			var group = _s.group(),
				x, y, text;

			if ('frequency' === node.type) {
				circle(node);
				x = parseFloat(node._ui.attr('cx'));
				y = parseFloat(node._ui.attr('cy'));
				group.append(node._ui);

				group.append(
					_s.text(x-15, y-10, node.intervals[0].percentage.toFixed(2) + '%').addClass('bold')
				);

				group.append(
					_s.text(x-25, y+10, '(' + node.label + ')')
				);

				_groupped.push({
					group: group,
					node: node
				});
			} else if ('attribute' === node.type) {
				rect(node);
				x = parseFloat(node._ui.attr('x'));
				y = parseFloat(node._ui.attr('y'));
				y += 28;
				x += 5;
				group.append(node._ui);
				group.append(
					_s.text(x, y, node.label)
				);
			}

			draggable(group, node);
		});
	}

	/**
	 * Constructor.
	 *
	 * @param s
	 * @param nodes
	 * @param links
	 */
	function start(s, nodes, links, normalize) {
		_s = s;
		_nodes = nodes;
		_links = links;
		_normalize = normalize;

		injectLinks();

		createNodes();

		placeLinks();
	}

	/**
	 * Draws a rectangle based on a node's positioning.
	 * @param node
	 */
	function rect(node) {
		node._ui = _s.rect(node.x, node.y, 120, 45);
		node._ui.attr({
			'fill': '#e74c3c'
		});
	}

	/**
	 * Draws a circle based on a node's positioning and size.
	 * @param node
	 */
	function circle(node) {
		var r = _normalize(node.intervals[0].percentage);
		node._ui = _s.circle(node.x, node.y, r);
		node._ui.attr({
			'fill': '#3498db'
		});
	}
	/**
	 * Make node-text groups draggable.
	 * @param group
	 * @param node
	 */
	function draggable(group, node) {
		group.drag(function(dx, dy, x, y) {

			this.attr({
				transform: this.data('transform') + (this.data('transform') ? 'T' : 't') + [dx, dy]
			});

			node.x = x;
			node.y = y;

			var boundingBox = group.getBBox();

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

	/**
	 * Hides a subgraph based on its frequency.
	 * @param frequency
	 * @param group
	 * @todo Refactoring! This and showSubgraph() Are quite alike and stuff could be done easier with lambdas.
	 */
	function hideSubgraph(frequency, group) {
		// Only do something if frequency is visible
		if (parseInt(group.attr('opacity')) == 1) {
			// Hide the frequency/label
			group.animate({
				opacity: 0
			}, 500, mina.easeinout);

			// Loop through all the frequency's links and therefore their targets
			frequency._links.forEach(function(link) {
				// If the target only has one link (to the frequency), hide the target.
				if (link.target.numberOfLinks === 1) {
					link.target._ui.animate({
						opacity: 0
					}, 500, mina.easeinout);
				}

				// Decrement the target's number of links as the link is going to be hidden in the next few lines
				link.target.numberOfLinks--;

				// See, as I promised you, the link is hidden! Wow!
				link._ui.animate({
					opacity: 0
				}, 500, mina.easeinout);
			});
		}
	}

	/**
	 * Shows a subgraph based on its frequency.
	 * @param frequency
	 * @param group
	 */
	function showSubgraph(frequency, group) {
		// Only do something if frequency i shidden
		if (parseInt(group.attr('opacity')) === 0) {
			// Show the frequency/label
			group.animate({
				opacity: 1
			}, 500, mina.easeinout);

			// Loop through all the frequency's links and therefore their targets
			frequency._links.forEach(function(link) {
				// If the target has no links, show the target.
				if (link.target.numberOfLinks === 0) {
					link.target._ui.animate({
						opacity: 1
					}, 500, mina.easeinout);
				}

				// Increment the target's number of links as the link is going to be shown in the next few lines
				link.target.numberOfLinks++;

				// See, as I promised you, the link is shown! Even more wow!
				link._ui.animate({
					opacity: 1
				}, 500, mina.easeinout);
			});
		}
	}

	/**
	 * Interval step, called from the Hypergraph.
	 * @param step
	 * @param threshold
	 */
	function next(step, threshold) {
		// Iterate over all subgraphs/frequencies
		_groupped.forEach(function(_group) {
			var intervals = _group.node.intervals;

			// Checks if the current step is actually defined for the subgraph
			if (!!intervals[step]) {
				if (intervals[step].percentage < threshold) {
					hideSubgraph(_group.node, _group.group);
				} else {
					showSubgraph(_group.node, _group.group);
				}
			}
		});
	}

	return {
		start: start,
		step: next
	};
})();