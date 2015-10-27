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
	var D3_FRICTION = 0.5;

	/**
	 * Gravity used for D3.js
	 * @see https://github.com/mbostock/d3/wiki/Force-Layout#gravity
	 * @type {number}
	 */
	var D3_GRAVITY = 0.25;

	/**
	 * Theta used for D3.js
	 * @see https://github.com/mbostock/d3/wiki/Force-Layout#theta
	 * @type {number}
	 */
	var D3_THETA = 0.75;

	/**
	 * Distance used for D3.js
	 * @see https://github.com/mbostock/d3/wiki/Force-Layout#linkDistance
	 * @type {number}
	 */
	var D3_LINK_DISTANCE = 250;

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
		return Math.pow(n, 4)/20;
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
			return this.nodes[this.getKey(el)];
		} else {
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

		var builder = new GraphBuilder();

		for (var i = 0; i < data.nodes.length; i++) {
			var subGraph = data.nodes[i].data,
				frequency = subGraph[subGraph.length - 1];

			for (var j = 0; j < subGraph.length; j++) {
				var node = builder.addNode(subGraph[j]);
				builder.link(frequency, node);
			}
		}

		console.info(builder);

		this.nodes = builder.nodes;
		this.links = builder.links;

		// TODO: Peeking isn't very nice!
		//this.nodes = data.nodes[0]['data'];
		//this.interval_visibility = data.nodes[0]['interval'];

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

		var subgraphGroup = this.subgraphGroup = svg.append('g').attr('class', 'subgraph');

		this.link = subgraphGroup
			.selectAll('line')
			.data(this.links)
			.enter()
			.insert('line')
			.style('stroke', D3_LINK_COLOR)
			.style('stroke-width', '1px')
			.attr('class', 'link');

		var nodeGroup = this.nodeGroup = subgraphGroup
			.selectAll('g')
			.data(this.nodes)
			.enter()
			.append('g')
			.attr('class', function(d) { return d.type; })
			.call(this.force.drag)
			.on('mousedown', function() { d3.event.stopPropagation(); });

		var frequency = this.frequency = {
			node: subgraphGroup.selectAll('.frequency').append('circle'),
			value: subgraphGroup.selectAll('.frequency').append('text').text(function(d) {
				return d.percentage + '%';
			})
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
			.charge(D3_CHARGE)
			.friction(D3_FRICTION)
			.gravity(D3_GRAVITY)
			.theta(D3_THETA)
			.linkDistance(D3_LINK_DISTANCE);

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
			frequencyIndex = subGraphs.length-1,
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
		this.frequency.node
			.attr('cx', function(d) { return d.x; })
			.attr('cy', function(d) { return d.y; })
			.attr('r', function(d) { return normalize(d.percentage); })
			.style('fill', D3_FREQUENCY_COLOR)
			.style('stroke', D3_FREQUENCY_STROKE);

		this.attribute.node
			.attr('x', function(d) { return d.x; })
			.attr('y', function(d) { return d.y; })
			.attr('width', D3_ATTRIBUTE_WIDTH)
			.attr('height', D3_ATTRIBUTE_HEIGHT)
			.style('fill', D3_ATTRIBUTE_COLOR)
			.style('stroke', D3_ATTRIBUTE_STROKE);

		this.link
			.attr('x1', function(d) { return d.source.x; })
			.attr('y1', function(d) { return d.source.y; })
			.attr('x2', function(d) { return d.target.x; })
			.attr('y2', function(d) { return d.target.y; });

		this.svg.selectAll('.frequency text').attr('transform', function(d) {
			return 'translate(' + (d.x-30) + ', ' + d.y + ')';
		});

		this.svg.selectAll('.attribute text').attr('transform', function(d) {
			return 'translate(' + (d.x+10) + ', ' + (d.y+35) + ')';
		});
	};

	/**
	 * Adjusts node/graph on animation iterations.
	 */
	Hypergraph.prototype.step = function() {
		if (this.steps === this.interval_count) {
			window.clearInterval(this.interval);
			log('Stepping through timeline done.')
			return;
		}

		var opacity = 1;

		if (this.interval_visibility[this.steps++] === 'invisible') {
			opacity = 0;
		}

		log('Interval Step ' + this.steps);

		this.svg
			.selectAll('g.subgraph')
			.transition()
			.duration(D3_TRANSITION_DURATION)
			.style('opacity', function() {
				return opacity;
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