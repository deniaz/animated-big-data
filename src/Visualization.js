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
	 * Attribute Node Width
	 * @const
	 * @type {number}
	 */
	var ATTRIBUTE_WIDTH = 120;

	/**
	 * Attribtue Node Height
	 * @const
	 * @type {number}
	 */
	var ATTRIBUTE_HEIGHT = 45;

	/**
	 * Color Peter River (Blue Light)
	 * @const
	 * @type {string}
	 */
	var C_PETER_RIVER = '#4DAEF0';

	/**
	 * Color Belize Hole (Blue Dark)
	 * @const
	 * @type {string}
	 */
	var C_BELIZE_HOLE = '#2980b9';

	/**
	 * Color Alizarin (Red Light)
	 * @const
	 * @type {string}
	 */
	var C_ALIZARIN = '#FA5746';

	/**
	 * Color Pomegranate (Red Dark)
	 * @const
	 * @type {string}
	 */
	var C_POMEGRANATE = '#c0392b';

	/**
	 * Color Wet Asphalt (Gray Light)
	 * @const
	 * @type {string}
	 */
	var AMETHYST = '#9b59b6';

	/**
	 * Color Midnight Blue (Gray Dark)
	 * @const
	 * @type {string}
	 */
	var C_MIDNIGHT_BLUE = '#2c3e50';

	/**
	 * Snap.svg instance
	 * @type {Paper}
	 * @private
	 */
	var _paper;

	/**
	 * Array containing all nodes
	 *
	 * @type {Array}
	 * @private
	 */
	var _nodes;

	/**
	 * Array containing all edges
	 *
	 * @type {Array}
	 * @private
	 */
	var _links;

	/**
	 * Normalize function
	 *
	 * @type {Function}
	 * @private
	 */
	var _normalize;

	/**
	 * Threshold
	 *
	 * @type {Number}
	 * @private
	 */
	var _threshold;

	/**
	 * Visualised Graph (all g Elements)
	 *
	 * @type {Array}
	 * @private
	 */
	var _vertices = [];

	/**
	 * Constructor.
	 *
	 * @param config
	 */
	function start(config) {
		_paper = config.paper;
		_nodes = config.nodes;
		_links = config.links;
		_normalize = config.normalize;
		_threshold = config.threshold;

		linkFactory();
		nodeFactory();

		_vertices.forEach(function(g) {
			if (aboveThreshold(g._node)) {
				showItemset(g);
			}

			draggable(g);
			highlightable(g);
		});
	}

	/**
	 * Factory for Edges/Links.
	 */
	function linkFactory() {
		_links.forEach(function(link) {
			var x1 = link.source.x,
				y1 = link.source.y,
				x2 = link.target.x,
				y2 = link.target.y;

			if (link.source.type === 'attribute') {
				x1 += ATTRIBUTE_WIDTH / 2;
				y1 += ATTRIBUTE_HEIGHT / 2;
			}

			if (link.target.type === 'attribute') {
				x2 += ATTRIBUTE_WIDTH / 2;
				y2 += ATTRIBUTE_HEIGHT / 2;
			}

			var el = _paper.line(x1, y1, x2, y2);

			el.attr({
				stroke: C_MIDNIGHT_BLUE,
				opacity: 0
			});

			link._ui = el;

			if (!!link.source._links) {
				link.source._links.push(link);
			} else {
				link.source._links = [ link ];
			}

			if (!!link.target._links) {
				link.target._links.push(link);
			} else {
				link.target._links = [ link ];
			}
		});
	}

	/**
	 * Factory for Nodes.
	 */
	function nodeFactory() {
		_nodes.forEach(function(node) {
			var g = group();

			if (node.type === 'frequency') {
				g.append(circle(node));
				g.append(frequencyValue(node));
				g.append(frequencyId(node));
			} else if (node.type === 'attribute') {
				node.activeLinks = 0;
				g.append(rect(node));
				g.append(itemLabel(node));
			}

			node._ui = g;
			g._node = node;
			_vertices.push(g);
		});
	}

	/**
	 * Creates and returns an SVG Node "g".
	 * @returns {*}
	 */
	function group() {
		var g = _paper.group();
		g.attr({
			opacity: 0
		});

		g._isVisible = false;

		return g;
	}

	/**
	 * Creates and returns an SVG Node "circle".
	 * @param node
	 * @returns {*}
	 */
	function circle(node) {
		var r = _normalize(node.intervals[0].percentage);
		var el = _paper.circle(node.x, node.y, r);
		el.attr({
			fill: C_BELIZE_HOLE
		});
		return el;
	}

	/**
	 * Creates and returns an SVG Node "rect".
	 * @param node
	 * @returns {*}
	 */
	function rect(node) {
		var el = _paper.rect(node.x, node.y, ATTRIBUTE_WIDTH, ATTRIBUTE_HEIGHT);
		el.attr({
			fill: C_POMEGRANATE
		});
		return el;
	}

	/**
	 * Creates and returns an SVG Node "text".
	 * It contains the initial percentage value of a frequency and is thus
	 * positioned within the circle.
	 *
	 * @param node
	 * @param step
	 */
	function frequencyValue(node, step) {
		if (!step) { step = 0; }
		var text = node.intervals[step].percentage.toFixed(2) + '%';

		return _paper.text(
			node.x - 15,
			node.y - 10,
			text
		).addClass('bold percentage');
	}

	/**
	 * Creates and returns an SVG Node "text".
	 * It contains the initial label of a frequency and is thus
	 * positioned within the circle.
	 * @param node
	 * @param step
	 */
	function frequencyId(node, step) {
		if (!step) { step = 0; }
		var text = '(' + node.intervals[step].label + ')';

		return _paper.text(
			node.x - 25,
			node.y + 10,
			text
		).addClass('freq-id');
	}

	/**
	 * Creates and returns an SVG Node "text".
	 * It contains the label of an item and is thus positioned within the rect.
	 * @param node
	 * @returns {*}
	 */
	function itemLabel(node) {
		return _paper.text(
			node.x + 10,
			node.y + 28,
			node.label
		);
	}

	/**
	 * Enable dragging for group elements.
	 * When dragging, the position of the links and the node have to be tracked.
	 * @param g
	 */
	function draggable(g) {
		var node = g._node;
		g.drag(function(dx, dy, x, y) {
			this.attr({
				transform: this.data('transform') + (this.data('transform') ? 'T' : 't') + [dx, dy]
			});

			node.x = x;
			node.y = y;

			var boundingBox = g.getBBox();

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

	function highlightable(g) {
		if (g._node.type === 'frequency') {
			highlightItemset(g);
		} else {
			highlightItem(g);
		}
	}

	/**
	 * Adds a mouseover/-out event listener to a frequency group.
	 * The underlying node will be highlighted along with its edges and connected nodes.
	 * @param g
	 */
	function highlightItemset(g) {
		var frequency = g.select('circle');
		var targets = g._node._links.map(function(link) {
			return link.target._ui.select('rect');
		});
		var links = g._node._links.map(function(link) {
			return link._ui;
		});

		g.hover(function() {
			if (g._isVisible) {
				frequency.animate({
					fill: C_PETER_RIVER
				}, 250, mina.easeinout);

				targets.forEach(function(target) {
					target.animate({
						fill: C_ALIZARIN
					}, 250, mina.easeinout);
				});

				links.forEach(function(link) {
					link.animate({
						stroke: AMETHYST,
						strokeWidth: 2
					}, 250, mina.easeinout);
				});
			}
		}, function() {
			frequency.animate({
				fill: C_BELIZE_HOLE
			}, 250, mina.easeinout);

			targets.forEach(function(target) {
				target.animate({
					fill: C_POMEGRANATE
				}, 250, mina.easeinout);
			});

			links.forEach(function(link) {
				link.animate({
					stroke: C_MIDNIGHT_BLUE,
					strokeWidth: 1
				}, 250, mina.easeinout);
			});
		});
	}

	/**
	 * Adds a mouseover/-out event listener to an attribute group.
	 * The underlying node will be highlighted along with its edges and connected nodes.
	 * @param g
	 */
	function highlightItem(g) {
		var attribute = g.select('rect');
		var sources = g._node._links.map(function(link) {
			return link.source._ui.select('circle');
		});
		var links = g._node._links.map(function(link) {
			return link._ui;
		});

		g.hover(function() {
			if (g._isVisible) {
				attribute.animate({
					fill: C_ALIZARIN
				}, 250, mina.easeinout);

				sources.forEach(function(source) {
					source.animate({
						fill: C_PETER_RIVER
					}, 250, mina.easeinout);
				});

				links.forEach(function(link) {
					link.animate({
						stroke: AMETHYST,
						strokeWidth: 2
					}, 250, mina.easeinout);
				});
			}
		}, function() {
			attribute.animate({
				fill: C_POMEGRANATE
			}, 250, mina.easeinout);

			sources.forEach(function(target) {
				target.animate({
					fill: C_BELIZE_HOLE
				}, 250, mina.easeinout);
			});

			links.forEach(function(link) {
				link.animate({
					stroke: C_MIDNIGHT_BLUE,
					strokeWidth: 1
				}, 250, mina.easeinout);
			});
		});
	}

	/**
	 * Checks if a node is above the required threshold for a given step.
	 * @param node
	 * @param step
	 * @returns {boolean}
	 */
	function aboveThreshold(node, step) {
		if (!step) { step = 0; }

		if (node.type === 'frequency' && !!node.intervals[step]) {
			return node.intervals[step].percentage >= _threshold;
		}

		return false;
	}

	/**
	 * Sets an itemset to visible.
	 * @param g
	 */
	function showItemset(g) {
		if (!g._isVisible) {
			toggleVisibility(g);
		}
	}

	/**
	 * Sets an itemset to hidden.
	 * @param g
	 */
	function hideItemset(g) {
		if (g._isVisible) {
			toggleVisibility(g);
		}
	}

	/**
	 * Change opacity of an itemset.
	 * @param g
	 */
	function toggleVisibility(g) {
		g._isVisible = !g._isVisible;

		g._node._links.forEach(function(link) {
			// If the itemset is going to be hidden but the connected node has more than one active node, it should stay
			// visible. Therefore only hide the connected node if it only has one active link.

			// The second condition checks if the connected node has no active links, as with active links it is already
			// visible.
			var toggleTarget = (!g._isVisible && link.target.activeLinks === 1 || g._isVisible && link.target.activeLinks === 0);
			if (toggleTarget) {
				link.target._ui.animate({
					opacity: g._isVisible ? 1 : 0
				}, 500, mina.easeinout).toggleClass('is-visible');

				link.target._ui._isVisible = g._isVisible;
			}

			if (g._isVisible) {
				link.target.activeLinks++;
			} else {
				link.target.activeLinks--;
			}

			link._ui.animate({
				opacity: g._isVisible ? 1 : 0
			}, 500, mina.easeinout);
		});

		g.animate({
			opacity: g._isVisible ? 1 : 0
		}, 500, mina.easeinout).toggleClass('is-visible');
	}

	/**
	 * Updates the radius of a circular node based on the current step.
	 * @param g
	 * @param step
	 */
	function updateRadius(g, step) {
		var r = _normalize(g._node.intervals[step].percentage);
		g.select('circle').animate({
			r: r
		}, 500, mina.easeinout);
	}

	/**
	 * Updates the text labels of a circular node based on the current step.
	 * @param g
	 * @param step
	 */
	function updateLabels(g, step) {
		var val = g.select('.percentage');
		val.node.textContent = g._node.intervals[step].percentage.toFixed(2) + '%';

		var id = g.select('.freq-id');
		id.node.textContent = '(' + g._node.intervals[step].label + ')';
	}

	/**
	 * Animation step. Iterates over the graph and triggers changes.
	 * @param step
	 */
	function next(step) {
		_vertices.forEach(function(g) {
			if (g._node.type === 'frequency') {
				if (!!g._node.intervals[step]) {
					updateLabels(g, step);
					updateRadius(g, step);
				}

				if (aboveThreshold(g._node, step)) {
					showItemset(g);
				} else {
					hideItemset(g);
				}
			}
		});
	}

	return {
		start: start,
		next: next,
		setThreshold: function(t) { _threshold = t; }
	};
})();