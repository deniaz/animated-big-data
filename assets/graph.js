(function(window, document, d3, undefined) {
	'use strict';

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

	/**
	 * Constructs Hypergraph.
	 *
	 * @param el HTMLNode to wrap the SVG
	 * @constructor
	 */
	function Hypergraph(el) {
		log('Init Hypergraph');
		this.container = el;

		this.interval_frequency = 2500;
		this.max_intervals = 0;
		this.current_interval = 0;
		this.threshold = 6.26;

		this.width = el.offsetWidth;
		this.height = window.innerHeight;

		this.vis = d3.select(el).append('svg:svg').attr('width', this.width).attr('height', this.height);
		this.force = d3.layout
			.force()
			.gravity(0.1)
			.charge(100)
			.linkStrength(function(l) {
				return l.strength;
			})
			.linkDistance(function(l) {
				return l.distance;
			})
			.size([this.width, this.height])
			.on('tick', this.tick.bind(this));

		window.focii = this.focii = {};

		this.nodes = this.force.nodes();
		this.links = this.force.links();

		this.update();
	}

	Hypergraph.prototype.tick = function(e) {
		var k = .5 * e.alpha;

		var frequencies = this.nodes.filter(function(o) {
			return o.type === 'frequency';
		});

		frequencies.forEach(function(o) {
			this.focii[o.id] = {
				x: o.x,
				y: o.y
			};
		}.bind(this));

		var attributes = this.nodes.filter(function(o) {
			return o.type === 'attribute';
		});

		attributes.forEach(function(o, i) {
			o.links.forEach(function(l) {

				var deviation = (i % 2) ? -10*(i+1) : 10*(i+1);

				o.y += (this.focii[l].y - o.y + deviation) * k;
				o.x += (this.focii[l].x - o.x + deviation*2) * k;

			}.bind(this));
		}.bind(this));

		this.frequencyLink.attr("x1", function(d) {
			return d.source.x;
		})
			.attr("y1", function(d) {
				return d.source.y;
			})
			.attr("x2", function(d) {
				return d.target.x;
			})
			.attr("y2", function(d) {
				return d.target.y;
			});

		this.attributeLink.attr('x1', function(d) {
			return d.source.x;
		}).attr("y1", function(d) {
			return d.source.y;
		})
			.attr("x2", function(d) {
				return d.target.x;
			})
			.attr("y2", function(d) {
				return d.target.y;
			});


		this.frequency.attr('transform', function(d) {
			return 'translate(' + d.x + ',' + d.y + ')';
		});

		this.attribute.attr('transform', function(d) {
			return 'translate(' + d.x + ',' + d.y + ')';
		});

		//this.update();
	};

	Hypergraph.prototype.addNode = function(node) {
		this.nodes.push(node);
		this.update();
	};

	Hypergraph.prototype.addAttribute = function(node, frequency) {
		var existing = this.findNode(node.id)
		if (existing === null) {
			node.links = [frequency.id];
			this.nodes.push(node);
		} else {
			if (existing.links.indexOf(frequency.id) === -1) {
				existing.links.push(frequency.id);
			}
		}
	};

	Hypergraph.prototype.addLink = function(source, target, strength, distance) {
		var source = this.findNode(source.id);
		var target = this.findNode(target.id);

		if (!!source && !!target) {
			this.links.push({
				source: source,
				target: target,
				strength: strength,
				distance: distance
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

		return null;
	};

	Hypergraph.prototype.load = function() {
		log('Loading Data');
		d3.json('data.json', this.loaded.bind(this));
	};

	Hypergraph.prototype.loaded = function(data) {
		log('Data loaded');

		this.addFrequencies(data);
		this.addAttributes(data);
		this.addLinks();
	};

	Hypergraph.prototype.addFrequencies = function(data) {
		var distance = this.height * .9;

		data.forEach(function(o) {
			var subgraph = o,
				frequency = subgraph[subgraph.length - 1];

			this.max_intervals = frequency.intervals.length > this.max_intervals ? frequency.intervals.length : this.max_intervals;
			this.addNode(frequency);
		}.bind(this));

		for (var i = 0; i < this.nodes.length; i++) {
			if (!!this.nodes[i] && !!this.nodes[i + 1]) {
				var current = this.nodes[i],
					next = this.nodes[i + 1];

				this.addLink(current, next, 1, distance);
			}
		}

		this.addLink(this.nodes[0], this.nodes[this.nodes.length - 1], 1, distance);
	};

	Hypergraph.prototype.addAttributes = function(data) {
		data.forEach(function(subgraph) {
			var frequency = subgraph[subgraph.length - 1];

			subgraph.forEach(function(o, i) {
				// 2 is because the last one is a frequency
				if (i < subgraph.length - 1) {
					this.addAttribute(o, frequency);
				}
			}.bind(this));
		}.bind(this));

		this.update();
	};

	Hypergraph.prototype.addLinks = function() {
		this.nodes.filter(function(o) {
			return o.type === 'attribute';
		}).forEach(function(o) {
			o.links.forEach(function(id) {
				this.addLink(o, { id: id }, 1, 150);
				//this.addLink(o, {id: id});
			}.bind(this));
		}.bind(this));
	};

	Hypergraph.prototype.updateFrequencies = function() {
		var frequencyLink = this.frequencyLink = this.vis
			.selectAll("line.hidden-link")
			.data(this.links.filter(function (link) {
				return link.source.type === 'frequency' && link.target.type === 'frequency';
			}), function(d) {
				return d.source.id + "-" + d.target.id;
			});

		frequencyLink
			.enter()
			.insert("line")
			.attr("class", "hidden-link");

		frequencyLink.exit().remove();

		var frequency = this.frequency = this.vis
			.selectAll('g.frequency')
			.data(this.nodes.filter(function (node) {
				return node.type === 'frequency';
			}), function(d) {
				return d.id;
			});

		var frequencyEnter = frequency.enter().append('g')
			.attr('class', 'frequency')
			.call(this.force.drag);

		frequencyEnter.append('circle')
			.attr('class', 'circle')
			.attr('cx', function(d) {
				return d.x;
			})
			.attr('cy', function(d) {
				return d.y;
			})
			.attr('r', function(d) {
				function normalize(n) { return Math.pow(n, 4) / 25; }
				return normalize(d.intervals[this.current_interval].percentage);
			}.bind(this))
			.attr('fill', 'deepskyblue');

		frequencyEnter.append('text')
			.attr('class', 'label')
			.attr('dx', 12)
			.attr('d', '.35em')
			.text(function(d) {
				return d.id;
			});

		frequency.exit().remove();
	};

	Hypergraph.prototype.updateAttributes = function() {
		var attributeLink = this.attributeLink = this.vis
			.selectAll('line.link')
			.data(this.links.filter(function(link) {
				return link.source.type === 'attribute' || link.target.type === 'attribute;'
			}), function(d) {
				return d.source.id + '-' + d.target.id;
			});

		attributeLink
			.enter()
			.insert('line')
			.attr('class', 'link');

		attributeLink.exit().remove();

		var attribute = this.attribute = this.vis
			.selectAll('g.attribute')
			.data(this.nodes.filter(function(node) {
				return node.type === 'attribute';
			}), function(d) {
				return d.id;
			});

		var attributeEnter = attribute.enter().append('g').attr('class', 'attribute').call(this.force.drag);

		attributeEnter.append('rect')
			.attr('x', function(d) { return d.x; })
			.attr('y', function(d) { return d.y; })
			.attr('width', 175)
			.attr('height', 60)
			.attr('fill', 'deeppink');

		attributeEnter.append('text')
			.attr('class', 'label')
			.attr('dx', 12)
			.attr('d', '.35em')
			.text(function(d) {
				return d.id;
			});

		attribute.exit().remove();
	};

	Hypergraph.prototype.update = function() {
		this.updateFrequencies();
		this.updateAttributes();

		// Restart the force layout.
		this.force.start();
	};

	Hypergraph.prototype.setInterval = function(interval) {
		this.interval_frequency = parseInt(interval);
		return this.interval_frequency;
	};

	Hypergraph.prototype.setThreshold = function(threshold) {
		this.threshold = parseFloat(threshold);
		return this.threshold;
	};

	document.addEventListener('DOMContentLoaded', function() {
		log('DOMContentLoaded');
		var graph = new Hypergraph(document.querySelector('.graph'));
		graph.load();

		document.querySelector('.js-interval').addEventListener('change', function(e) {
			document.querySelector('.js-current-interval').textContent = graph.setInterval(e.target.value);
		});

		document.querySelector('.js-threshold').addEventListener('change', function(e) {
			document.querySelector('.js-current-threshold').textContent = graph.setThreshold(e.target.value);
		});
	});
})(window, document, d3);