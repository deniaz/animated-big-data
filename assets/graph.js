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

		this.vis = d3.select(el).append('svg:svg').attr('width', this.width).attr('height', this.height);
		this.force = d3.layout.force().gravity(.05).distance(100).charge(-100).size([this.width, this.height]);

		this.nodes = this.force.nodes();
		this.links = this.force.links();

		this.update();

		window.update = this.update.bind(this);

	}

	Hypergraph.prototype.update = function() {
		var link = this.vis
			.selectAll("line.link")
			.data(this.links, function(d) { return d.source.id + "-" + d.target.id; });

		link
			.enter()
			.insert("line")
			.attr("class", "link");

		link.exit().remove();

		var node = this.vis
			.selectAll("g.node")
			.data(this.nodes, function(d) { return d.id;});

		var nodeEnter = node.enter().append("g")
			.attr("class", "node")
			.call(this.force.drag);

		nodeEnter.append("circle")
			.attr("class", "circle")
			.attr("cx", "-8px")
			.attr("cy", "-8px")
			.attr("r", "8px")
			.attr('fill', 'deepskyblue');

		nodeEnter.append("text")
			.attr("class", "nodetext")
			.attr("dx", 12)
			.attr("dy", ".35em")
			.text(function(d) {
				return d.id
			});

		node.exit().remove();

		this.force.on("tick", function() {
			link.attr("x1", function(d) { return d.source.x; })
				.attr("y1", function(d) { return d.source.y; })
				.attr("x2", function(d) { return d.target.x; })
				.attr("y2", function(d) { return d.target.y; });

			node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
		});

		// Restart the force layout.
		this.force.start();
	};

	Hypergraph.prototype.addNode = function(node) {
		this.nodes.push(node);
		this.update();
	};

	Hypergraph.prototype.addLink = function(source, target) {
		var source = this.findNode(source.id);
		var target = this.findNode(target.id);

		if (!!source && !!target) {
			this.links.push({
				source: source,
				target: target
			});

			this.update();
		}
	};

	Hypergraph.prototype.findNode = function(id) {
		for (var i = 0; i < this.nodes.length; i++) {
			var node = this.nodes[i];
			if (node.id === id) {
				return node;
			}
		}
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

		//var subgraph = data.nodes[0].data,
		//	frequency = subgraph[subgraph.length - 1];
		//
		//this.addNode(frequency);
		//
		//for (var i = 0; i < subgraph.length - 1; i++) {
		//	var node = data.nodes[0].data[i];
		//	this.addNode(node);
		//	this.addLink(frequency, node);
		//}

		for (var i = 0; i < data.nodes.length; i++) {
			var subgraph = data.nodes[i].data,
				frequency = subgraph[subgraph.length - 1];

			this.addNode(frequency);

			for (var j = 0; j < subgraph.length - 1; j++) {
				var node = subgraph[j];
				this.addNode(node);
				this.addLink(frequency, node);
			}
		}
	};

	/**
	 * Start Hypergraph on DOMContentLoaded.
	 */
	document.addEventListener('DOMContentLoaded', function() {
		log('DOMContentLoaded');
		var graph = new Hypergraph(document.querySelector('.graph'));
		graph.load();

	});
})(window, document, d3);