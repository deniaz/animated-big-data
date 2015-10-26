(function(window, document, d3, undefined) {
	'use strict';

	var D3_CHARGE = -200;
	var D3_LINK_DISTANCE = 250;
	var D3_FREQUENCY_COLOR = '#3498db';
	var D3_FREQUENCY_STROKE = '#2980b9';
	var D3_ATTRIBUTE_COLOR = '#e74c3c';
	var D3_ATTRIBUTE_STROKE = '#c0392b';
	var D3_LINK_COLOR = '#34495e';
	var D3_ATTRIBUTE_WIDTH = 175;
	var D3_ATTRIBUTE_HEIGHT = 60;
	var D3_RADIUS_FACTOR = 10;
	var D3_TRANSITION_DURATION = 250;

	function log(msg) {
		if (!!window.console.log) {
			window.console.log(msg);
		}
	}

	function Hypergraph(el) {
		log('Init Hypergraph');
		this.container = el;

		this.width = el.offsetWidth;
		this.height = window.innerHeight;

		this.steps = 0;

		this.layout();
	}

	Hypergraph.prototype.layout = function() {
		log('Force Layout');
		this.force = d3.layout.force().size([this.width, this.height]);
	};

	Hypergraph.prototype.load = function() {
		log('Loading Data');
		d3.json('data.json', function(data) {
			log('Data loaded');
			this.interval_frequency = data.interval_frequency;
			this.interval_count = data.interval_count;

			// TODO: Peeking isn't very nice!
			this.sub_graphs = data.sub_graphs[0]['data'];
			this.interval_visibility = data.sub_graphs[0]['interval'];

			this.draw();
		}.bind(this));
	};

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
			.data(this.links())
			.enter()
			.insert('line')
			.style('stroke', D3_LINK_COLOR)
			.style('stroke-width', '1px')
			.attr('class', 'link');

		var nodeGroup = this.nodeGroup = subgraphGroup
			.selectAll('g')
			.data(this.sub_graphs)
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

	Hypergraph.prototype.start = function() {
		log('Injecting data into Layout');

		this.force
			.nodes(this.sub_graphs)
			.links(this.links())
			.charge(D3_CHARGE)
			.linkDistance(D3_LINK_DISTANCE);

		this.force.start();

		this.force.on('tick', this.onTick.bind(this));

		this.interval = window.setInterval(this.step.bind(this), this.interval_frequency);
	};

	Hypergraph.prototype.links = function() {
		// Frequency is always the last element in the array
		var subGraphs = this.sub_graphs,
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

	Hypergraph.prototype.onTick = function() {
		this.frequency.node
			.attr('cx', function(d) { return d.x; })
			.attr('cy', function(d) { return d.y; })
			.attr('r', function(d) { return d.percentage * D3_RADIUS_FACTOR; })
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


	document.addEventListener('DOMContentLoaded', function() {
		log('DOMContentLoaded');

		(new Hypergraph(document.querySelector('.graph'))).load();
	});
})(window, document, d3);