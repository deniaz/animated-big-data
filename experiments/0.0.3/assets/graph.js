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
	var D3_RADIUS_FACTOR = 1;
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

		this.interval_frequency = 2500;

		this.layout();
	}

	Hypergraph.prototype.layout = function() {
		log('Force Layout');
		this.force = d3.layout.force().size([this.width, this.height]);
	};

	Hypergraph.prototype.load = function() {
		log('Loading Data');

		var data = this.data = [
			{
				color: '#2980b9',
				percentage: 84.9
			},
			{
				color: '#2980b9',
				percentage: 39.2
			},
			{
				w: 175,
				h: 60,
				color: '#c0392b',
				name: 'Käse'
			},
			{
				w: 125,
				h: 60,
				color: '#c0392b',
				name: 'Brot'
			},
			{
				w: 200,
				h: 60,
				color: '#c0392b',
				name: 'Milch'
			}
		];
		this.links = [
			{
				source: data[0],
				target: data[2],
				name: '80-brtwrst'
			},
			{
				source: data[0],
				target: data[3],
				name: '80-brot'
			},
			{
				source: data[1],
				target: data[2],
				name: '39-brtwrst'
			},
			{
				source: data[1],
				target: data[3],
				name: '39-brot'
			},
			{
				source: data[1],
				target: data[4],
				name: '39-bier'
			}
		];

		this.draw();
	};

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

		var nodeGroup = this.nodeGroup = svg
			.selectAll('g')
			.data(this.data)
			.enter()
			.append('g')
			.attr('class', function(d) {
				if (!!d.name) {
					return 'attribute';
				} else {
					return 'frequency';
				}
			})
			.call(this.force.drag)
			.on('mousedown', function() {
				d3.event.stopPropagation();
			});

		var frequency = this.frequency = {
			node: svg.selectAll('.frequency').append('circle'),
			value: svg.selectAll('.frequency').append('text').text(function(d) {
				return d.percentage + '%';
			})
		};

		var attribute = this.attribute = {
			node: svg.selectAll('.attribute').append('rect'),
			label: svg.selectAll('.attribute').append('text').text(function(d) {
				return d.name;
			})
		};

		this.start();
	};

	Hypergraph.prototype.start = function() {
		log('Injecting data into Layout');

		this.force
			.nodes(this.data)
			.links(this.links)
			.charge(D3_CHARGE)
			.linkDistance(D3_LINK_DISTANCE);

		this.force.start();

		this.force.on('tick', this.onTick.bind(this));

		this.interval = window.setInterval(this.step.bind(this), this.interval_frequency);
	};

	Hypergraph.prototype.onTick = function() {
		this.frequency.node
			.attr('cx', function(d) {
				return d.x;
			})
			.attr('cy', function(d) {
				return d.y;
			})
			.attr('r', function(d) {
				return d.percentage * D3_RADIUS_FACTOR;
			})
			.style('fill', D3_FREQUENCY_COLOR)
			.style('stroke', D3_FREQUENCY_STROKE);

		this.attribute.node
			.attr('x', function(d) {
				return d.x;
			})
			.attr('y', function(d) {
				return d.y;
			})
			.attr('width', function(d) {
				return d.w;
			})
			.attr('height', function(d) {
				return d.h;
			})
			.style('fill', function(d) {
				return d.color;
			});

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

	Hypergraph.prototype.step = function() {
		if (Math.round(Math.random())) {
			log('Randomly showing');
			this.attribute.node
				.transition()
				.duration(250)
				.style('opacity', function(d) {
					if (d.name === 'Milch') {
						return 1;
					}
				});

			this.frequency.node
				.transition()
				.duration(250)
				.style('opacity', function(d) {
					if (d.percentage === 39.2) {
						return 1;
					}
				});

			this.link
				.transition()
				.duration(250)
				.style('opacity', function(d) {
					if (d.name === '39-bier' || d.name === '39-brot' || d.name === '39-brtwrst') {
						return 1;
					}
				});
		} else {
			log('Randomly hiding');
			this.attribute.node
				.transition()
				.duration(250)
				.style('opacity', function(d) {
					if (d.name === 'Milch') {
						return 0;
					}
				});

			this.frequency.node
				.transition()
				.duration(250)
				.style('opacity', function(d) {
					if (d.percentage === 39.2) {
						return 0;
					}
				});

			this.link
				.transition()
				.duration(250)
				.style('opacity', function(d) {
					if (d.name === '39-bier' || d.name === '39-brot' || d.name === '39-brtwrst') {
						return 0;
					}
				});
		}
	};


	document.addEventListener('DOMContentLoaded', function() {
		log('DOMContentLoaded');

		(new Hypergraph(document.querySelector('.graph'))).load();
	});
})(window, document, d3);