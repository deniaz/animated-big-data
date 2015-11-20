(function(window, document, d3, undefined) {
	'use strict';

	/**
	 * Charge used for D3.js
	 * @see https://github.com/mbostock/d3/wiki/Force-Layout#charge
	 * @type {number}
	 */
	var D3_CHARGE = -1000;

	/**
	 * Friction used for D3.js
	 * @see https://github.com/mbostock/d3/wiki/Force-Layout#friction
	 * @type {number}
	 */
	var D3_FRICTION = 0.9;

	/**
	 * Gravity used for D3.js
	 * @see https://github.com/mbostock/d3/wiki/Force-Layout#gravity
	 * @type {number}
	 */
	var D3_GRAVITY = 0.2;

	/**
	 * Theta used for D3.js
	 * @see https://github.com/mbostock/d3/wiki/Force-Layout#theta
	 * @type {number}
	 */
	var D3_THETA = 0.8;

	/**
	 * Distance used for D3.js
	 * @see https://github.com/mbostock/d3/wiki/Force-Layout#linkDistance
	 * @type {number}
	 */
	var D3_LINK_DISTANCE = 30;

	/**
	 * Background Color for Frequency Circles
	 * @type {string}
	 */
	var D3_FREQUENCY_COLOR = '#3498db';

	/**
	 * Border Color for Frequency Circles
	 * @type {string}
	 */
	var D3_FREQUENCY_STROKE = '#2980b9';

	/**
	 * Background Color for Attribute Rectangles
	 * @type {string}
	 */
	var D3_ATTRIBUTE_COLOR = '#e74c3c';

	/**
	 * Border Color for Attribute Rectangles
	 * @type {string}
	 */
	var D3_ATTRIBUTE_STROKE = '#c0392b';

	/**
	 * Link Color
	 * @type {string}
	 */
	var D3_LINK_COLOR = '#34495e';

	/**
	 * Attribute Rectangle Width
	 * @type {number}
	 */
	var D3_ATTRIBUTE_WIDTH = 175;

	/**
	 * Attribtue Rectangle Height
	 * @type {number}
	 */
	var D3_ATTRIBUTE_HEIGHT = 60;

	/**
	 * Transition Duration
	 * @type {number}
	 */
	var D3_TRANSITION_DURATION = 500;

	/**
	 * Helper function which checks for the existence of window.console before logging.
	 * Prevents errors in old browsers.
	 *
	 * @param msg
	 */
	function log(msg) {
		if (!!window.console && !!window.console.log) {
			window.console.log(msg);
		}
	}

	function normalize(n) {
		return Math.pow(n, 4) / 25;
	}

	function GraphBuilder() {
		this.nodes = [];
		this.links = [];
	}

	GraphBuilder.prototype.getKey = function(el) {
		for (var i = 0; i < this.nodes.length; i++) {
			var n = this.nodes[i];
			if (!!n.id && !!el.id && n.id === el.id) {
				return i;
			}
		}

		throw Error('Element not found.');
	};

	GraphBuilder.prototype.containsNode = function(el) {
		try {
			this.getKey(el);
			return true;
		} catch (e) {
			return false;
		}
	};

	GraphBuilder.prototype.addNode = function(el) {
		if (this.containsNode(el)) {
			var key = this.getKey(el);
			this.nodes[key].instances++;
			return this.nodes[key];
		} else {
			el.instances = 1;
			return this.nodes.push(el) - 1;
		}
	};

	GraphBuilder.prototype.link = function(source, target) {
		if (target.type !== 'frequency') {
			this.links.push({
				source: source,
				target: target
			})
		}
	};

	GraphBuilder.prototype.getConnectedNodes = function(frequency) {
		var subgraph = [];

		for (var i = 0; i < this.links.length; i++) {
			var link = this.links[i];
			if (link.source.label === frequency.label) {
				subgraph.push(link.target);
			}
		}

		return subgraph;
	};

	GraphBuilder.prototype.getNodes = function() {
		this.sort();

		return this.nodes;
	};

	GraphBuilder.prototype.sort = function() {
		if (window.sortNodes) {
			this.nodes.sort(window.sortNodes);
		}

		/**
		 * Randomizing the links-array doesn't change anything at all.
		 */
		//function shuffle(arr) {
		//	var counter = arr.length,
		//		tmp,
		//		i;
		//
		//	while (counter > 0) {
		//		i = Math.floor(Math.random() * counter--);
		//		tmp = arr[counter];
		//		arr[counter] = arr[i];
		//		arr[i] = tmp;
		//	}
		//
		//	return arr;
		//}
		//
		//this.links = shuffle(this.links);
	};

	/**
	 * Constructs Hypergraph.
	 *
	 * @param el HTMLNode to wrap the SVG
	 * @constructor
	 */
	function Hypergraph(el) {
		log('Init Hypergraph');
		this.container = el;

		this.width = el.offsetWidth;
		this.height = window.innerHeight;

		this.steps = 0;

		this.layout();
	}

	/**
	 * Starts D3's Force Layout.
	 */
	Hypergraph.prototype.layout = function() {
		log('Force Layout');
		this.force = d3.layout.force().size([this.width, this.height]);
	};

	/**
	 * Loads JSON data asynchronously.
	 */
	Hypergraph.prototype.load = function() {
		log('Loading Data');
		d3.json('data.json', this.loaded.bind(this));
	};

	/**
	 * AJAX Callback. Sets data as Hypergraph properties.
	 * @param data JSON Graph Data
	 */
	Hypergraph.prototype.loaded = function(data) {
		log('Data loaded');
		this.interval_frequency = data.interval_frequency;
		this.interval_count = data.interval_count;
		this.threshold = data.threshold;

		var builder = this.builder = new GraphBuilder();

		for (var i = 0; i < data.nodes.length; i++) {
			var subGraph = data.nodes[i].data,
				frequency = subGraph[subGraph.length - 1];

			/**
			 * Currently the nodes are inserted as in the file:
			 * [attr, attr, attr, attr, freq]
			 *
			 * The commented code puts freq in front:
			 * [freq, attr, attr, attr, attr]
			 */
			//builder.addNode(frequency);
			//for (var j = 0; j < subGraph.length-1; j++) {

			for (var j = 0; j < subGraph.length; j++) {
				var node = builder.addNode(subGraph[j]);
				builder.link(frequency, node);
			}
		}

		this.nodes = builder.getNodes();
		this.links = builder.links;

		this.draw();
	};

	/**
	 * Draws the graph.
	 */
	Hypergraph.prototype.draw = function() {
		log('Init Graph Drawing');

		var svg = this.svg =
			d3
				.select('.js-graph')
				.append('svg')
				.attr('width', this.width)
				.attr('height', this.height);

		this.link = svg
			.selectAll('line')
			.data(this.links)
			.enter()
			.insert('line')
			.style('stroke', D3_LINK_COLOR)
			.style('stroke-width', '1px')
			.attr('class', 'link');


		this.frequency = {
			node: svg.selectAll('g')
				.data(this.nodes)
				.enter()
				.append('g')
				.attr('class', function(d) {
					return d.type;
				})
				.call(this.force.drag)
				.on('mousedown', function(d) {
					return d.type;
				})
				.filter('.frequency')
				.append('circle'),
			value: svg.selectAll('.frequency').append('text').text(function(d) {
				return d.intervals[this.steps].percentage + '%';
			}.bind(this))
		};

		var attribute = this.attribute = {
			node: svg.selectAll('.attribute').append('rect'),
			label: svg.selectAll('.attribute').append('text').text(function(d) {
				return d.label;
			})
		};

		this.start();
	};

	/**
	 * Starts the Force Layout and sets the Interval.
	 */
	Hypergraph.prototype.start = function() {
		log('Injecting data into Layout');

		this.force
			.nodes(this.nodes)
			.links(this.links)
			.charge(function(node) {
				if (node.type === 'attribute') {
					return D3_CHARGE;
				} else {
					return node.intervals[this.steps].percentage * 200 * (-1);
				}
			}.bind(this))
			.friction(D3_FRICTION)
			.gravity(D3_GRAVITY)
			.theta(D3_THETA)
			.linkDistance(function(link, index) {
				return parseInt(Math.round(Math.random() * 750))
			})
			.linkStrength(function(link, index) {
				return Math.random();
			});

		this.force.start();

		this.force.on('tick', this.onTick.bind(this));

		//this.interval = window.setInterval(this.step.bind(this), this.interval_frequency);
	};

	/**
	 * Returns all links of the Hypergraph.
	 * @returns {Array}
	 */
	Hypergraph.prototype.links = function() {
		// Frequency is always the last element in the array
		var subGraphs = this.nodes,
			frequencyIndex = subGraphs.length - 1,
			frequency = subGraphs[frequencyIndex],
			links = [];

		for (var i = 0; i <= frequencyIndex; i++) {
			links.push({
				source: frequency,
				target: subGraphs[i]
			});
		}

		return links;
	};

	/**
	 * Adjusts graph on every minor Force Layout change.
	 */
	Hypergraph.prototype.onTick = function() {

		//var q = d3.geom.quadtree(this.nodes),
		//	i = 0,
		//	n = this.nodes.length;
		//
		//while (++i < n) {
		//	q.visit(this.collide(this.nodes[i]));
		//}

		this.frequency.node
			.attr('cx', function(d) {
				return d.x;
			})
			.attr('cy', function(d) {
				return d.y;
			})
			.attr('r', function(d) {
				return normalize(d.intervals[this.steps].percentage);
			}.bind(this))
			.style('fill', D3_FREQUENCY_COLOR)
			.style('stroke', D3_FREQUENCY_STROKE);


		this.attribute.node
			.attr('x', function(d) {
				return d.x;
			})
			.attr('y', function(d) {
				return d.y;
			})
			.attr('width', D3_ATTRIBUTE_WIDTH)
			.attr('height', D3_ATTRIBUTE_HEIGHT)
			.style('fill', D3_ATTRIBUTE_COLOR)
			.style('stroke', D3_ATTRIBUTE_STROKE);

		this.link
			.attr('x1', function(d) {
				return d.source.x;
			})
			.attr('y1', function(d) {
				return d.source.y;
			})
			.attr('x2', function(d) {
				return d.target.x;
			})
			.attr('y2', function(d) {
				return d.target.y;
			});

		this.svg.selectAll('.frequency text').attr('transform', function(d) {
			return 'translate(' + (d.x - 30) + ', ' + d.y + ')';
		});

		this.svg.selectAll('.attribute text').attr('transform', function(d) {
			return 'translate(' + (d.x + 10) + ', ' + (d.y + 35) + ')';
		});
	};

	Hypergraph.prototype.collide = function(node) {
		var pad = 5,
			step = this.steps,
			r, nx1, nx2, ny1, ny2;

		var collision = function(p1x1, p1y1, p1x2, p1y2, p2x1, p2y1, p2x2, p2y2) {
			return (
				p1x1 < p2x2 &&
				p2x1 < p1x2 &&
				p1y1 < p2y1 &&
				p2y1 < p1y2
			);
		};

		if ('frequency' === node.type) {
			r = normalize(node.intervals[step].percentage);
			nx1 = node.x - r;
			nx2 = node.x + r;
			ny1 = node.y - r;
			ny2 = node.y + r;
		} else {
			nx1 = node.x;
			nx2 = node.x + D3_ATTRIBUTE_WIDTH;
			ny1 = node.y;
			ny2 = node.y + D3_ATTRIBUTE_HEIGHT;
		}

		return function(quad, x1, y1, x2, y2) {
			if (quad.point && (quad.point !== node)) {
				var p = quad.point,
					px1,
					px2,
					py1,
					py2,
					dx,
					dy;

				if ('frequency' === node.type) {
					var r = normalize(node.intervals[step].percentage);
					px1 = p.x - r;
					px2 = p.x + r;
					py1 = p.y - r;
					py2 = p.y + r;
				} else {
					px1 = p.x;
					px2 = p.x + D3_ATTRIBUTE_WIDTH;
					py1 = p.y;
					py2 = p.y + D3_ATTRIBUTE_WIDTH;
				}

				if (collision(nx1 - pad, ny1 - pad, nx2 + pad, ny2 + pad, px1, py1, px2, py2)) {
					dx = Math.min(nx2 - px1, px2 - nx1) / 2;
					node.x -= dx;
					quad.point.x += dx;
					dy = Math.min(ny2 - py1, py2 - ny1) / 2;
					node.y -= dy;
					quad.point.y += dy;
				}
			}

			return (
				x1 > nx2 ||
				x2 < nx1 ||
				y1 > ny2 ||
				y2 < ny1
			);
		};
	};

	/**
	 * Adjusts node/graph on animation iterations.
	 */
	Hypergraph.prototype.step = function() {

		log('Interval ' + this.steps);
		if (this.steps++ === this.interval_count - 1) {
			window.clearInterval(this.interval);
			log('Done with intervals');
			return;
		}

		var hiddenFreq = [];
		var attrToHide = [];

		this.frequency.node
			.transition()
			.duration(D3_TRANSITION_DURATION)
			.style('opacity', function(d) {
				// keep track of newly hidden frequency
				if (d.intervals[this.steps].percentage >= this.threshold) {
					return 1;
				} else {
					hiddenFreq.push(d);
					attrToHide = attrToHide.concat(this.builder.getConnectedNodes(d));
					//newlyHidden.push(d);
					return 0;
				}
			}.bind(this))
			.attr('r', function(d) {
				return normalize(d.intervals[this.steps].percentage);
			}.bind(this));

		this.frequency.value
			.text(function(d) {
				return d.intervals[this.steps].percentage + '%';
			}.bind(this))
			.style('opacity', function(d) {
				return d.intervals[this.steps].percentage >= this.threshold ? 1 : 0;
			}.bind(this));

		this.attribute.node
			.transition()
			.duration(D3_TRANSITION_DURATION)
			.style('opacity', function(d) {
				for (var i = 0; i < attrToHide.length; i++) {
					var attr = attrToHide[i];
					if (d.id === attr.id && attr.instances === 1) {
						return 0;
					}
				}

				return 1;
			});

		this.attribute.label
			.transition()
			.duration(D3_TRANSITION_DURATION)
			.style('opacity', function(d) {
				for (var i = 0; i < attrToHide.length; i++) {
					var attr = attrToHide[i];
					if (d.id === attr.id && attr.instances === 1) {
						return 0;
					}
				}

				return 1;
			}.bind(this));

		this.link
			.transition()
			.duration(D3_TRANSITION_DURATION)
			.style('opacity', function(d) {
				return attrToHide.indexOf(d.target) > -1 && hiddenFreq.indexOf(d.source) > -1 ? 0 : 1;
			});
	};

	/**
	 * Start Hypergraph on DOMContentLoaded.
	 */
	document.addEventListener('DOMContentLoaded', function() {
		log('DOMContentLoaded');

		(new Hypergraph(document.querySelector('.graph'))).load();
	});
})(window, document, d3);