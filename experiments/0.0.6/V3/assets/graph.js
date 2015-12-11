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
	var D3_GRAVITY = 0.1;

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
	
	var FREQUENCY_HIDE_SIZE = 5;
	var COLLISION_PADDING = 0;
	var STEPS = 0;

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
		return Math.pow(n, 4) / 20;
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

		STEPS = 0;

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

		var builder = new GraphBuilder();

		for (var i = 0; i < data.nodes.length; i++) {
			var subGraph = data.nodes[i].data,
				frequency = subGraph[subGraph.length - 1];

			for (var j = 0; j < subGraph.length; j++) {
				var node = builder.addNode(subGraph[j]);
				builder.link(frequency, node);
			}
		}

		this.nodes = builder.nodes;
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
				return d.intervals[STEPS].percentage + '%';
			}.bind(this))
		};

		//var nodeGroup = this.nodeGroup = svg
		//	.selectAll('g')
		//	.data(this.nodes)
		//	.enter()
		//	.append('g')
		//	.attr('class', function(d) {
		//		return d.type;
		//	})
		//	.call(this.force.drag)
		//	.on('mousedown', function() {
		//		d3.event.stopPropagation();
		//	});
		//
		//var frequency = this.frequency = {
		//	node: svg.selectAll('.frequency').append('circle'),
		//	value: svg.selectAll('.frequency').append('text').text(function(d) {
		//		return d.intervals[STEPS].percentage + '%';
		//	}.bind(this))
		//};
		//
		//console.info(frequency);

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
					return node.intervals[STEPS].percentage * 200 * (-1);
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

		this.interval = window.setInterval(this.step.bind(this), this.interval_frequency);
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

	function collisionDetection(nodes) {
	    nodes.forEach(function (a, i) {
	        var nodeA = nodeTransformation(a);
	        nodes.slice(i + 1).forEach(function (b) {
	            var nodeB = nodeTransformation(b),
                    dx, dy, adx, ady, mdx, mdy, l, lx, ly;

	            dx = (nodeA.x - nodeB.x);
	            dy = (nodeA.y - nodeB.y);

	            adx = Math.abs(dx);
	            ady = Math.abs(dy);

	            mdx = (nodeA.width + nodeB.width) / 2;
	            mdy = (nodeA.height + nodeB.height) / 2;

	            if (adx < mdx && ady < mdy) {
	                l = Math.sqrt(dx * dx + dy * dy);
	                lx = (adx - mdx) / l;
	                ly = (ady - mdy) / l;

	                if (lx > ly && ly > 0) lx = 0;
	                else if (ly > lx && lx > 0) ly = 0;

	                dx *= lx;
	                dy *= ly;
                    
	                var aTranslation = reverseNodeTransformation(a, dx, dy),
                        bTranslation = reverseNodeTransformation(b, dx, dy);

	                a.x -= aTranslation.x;
	                a.y -= aTranslation.y;
	                b.x += bTranslation.x;
	                b.y += bTranslation.y;
	            }
	        });
	    });
	}

	function nodeTransformation(node) {
	    var nx, ny, nw, nh, r;
	    if (node.type == "frequency") {
	        r = normalize(node.intervals[STEPS].percentage);
	        nx = node.x - r;
	        ny = node.y - r;
	        nw = (node.x + r) - nx; // x2 - x1
	        nh = (node.y + r) - ny; // y2 - y1
	    } else {
	        nx = node.x;
	        ny = node.y;
	        nw = D3_ATTRIBUTE_WIDTH;
	        nh = D3_ATTRIBUTE_HEIGHT;
	    }

	    return {
	        x: nx,
	        y: ny,
	        width: nw,
	        height: nh
	    }
	}

	function reverseNodeTransformation(node, x, y) {
	    var dx, dy;
	    if (node.type == "frequency") {
	        var r = normalize(node.intervals[STEPS].percentage);
	        dx = x + r;
	        dy = y + r;
	    } else {
	        dx = x;
	        dy = y;
	    }

	    return {
	        x: dx,
            y: dy
	    }
	}
	
	//function collisionDetection(nodes) {
	//	var q = d3.geom.quadtree(nodes),
	//		i = 0,
	//		n = nodes.length;
			
	//	while (++i < n) {
	//	    q.visit(collide(nodes[i]));
	//	}
	//}
	
	//function collide(node) {
	//    var pad = COLLISION_PADDING,
    //        nx1, nx2, ny1, ny2;

	//    if (node.type == "frequency") {
	//        var r = normalize(node.intervals[STEPS].percentage);
	//        nx1 = node.x - r;
	//        nx2 = node.x + r;
	//        ny1 = node.y - r;
	//        ny2 = node.y + r;
	//    }
	//    else {
	//        nx1 = node.x;
	//        nx2 = node.x + D3_ATTRIBUTE_WIDTH;
	//        ny1 = node.y;
	//        ny2 = node.y + D3_ATTRIBUTE_HEIGHT;
	//    }

	//    return function (quad, x1, y1, x2, y2) {
	//        if (quad.point && (quad.point !== node)) {
	//            var p = quad.point,
	//                px1, px2, py1, py2, dx, dy;

	//            if (p.type == "frequency") {
	//                var r = normalize(p.intervals[STEPS].percentage);
	//                px1 = p.x - r;
	//                px2 = p.x + r;
	//                py1 = p.y - r;
	//                py2 = p.y + r;
	//            } else {
	//                px1 = p.x;
	//                px2 = p.x + D3_ATTRIBUTE_WIDTH;
	//                py1 = p.y;
	//                py2 = p.y + D3_ATTRIBUTE_HEIGHT;
	//            }

	//            if (collision(nx1 - pad, ny1 - pad, nx2 + pad, ny2 + pad, px1, py1, px2, py2)) {
	//                dx = Math.min(nx2 - px1, px2 - nx1) / 2;
	//                node.x -= dx;
	//                quad.point.x += dx;
	//                dy = Math.min(ny2 - py1, py2 - ny1) / 2;
	//                node.y -= dy;
	//                quad.point.y += dy;
	//            }
	//        }
	//        return x1 > nx2
	//			|| x2 < nx1
	//			|| y1 > ny2
	//			|| y2 < ny1;
	//    };
	//}

	//function collision(p1x1, p1y1, p1x2, p1y2, p2x1, p2y1, p2x2, p2y2) {
	//    return (p1x1 < p2x2 &&
    //        p2x1 < p1x2 &&
    //        p1y1 < p2y1 &&
    //        p2y1 < p1y2) ? true : false;
	//}

	/**
	 * Adjusts graph on every minor Force Layout change.
	 */
	Hypergraph.prototype.onTick = function() {
		
	    collisionDetection(this.nodes);

		this.frequency.node
			.attr('cx', function(d) {
				return d.x;
			})
			.attr('cy', function(d) {
				return d.y;
			})
			.attr('r', function(d) {
				if (d.intervals[STEPS].percentage >= this.threshold) {
					return normalize(d.intervals[STEPS].percentage);
				} else {
					return FREQUENCY_HIDE_SIZE;
				}				
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

	/**
	 * Adjusts node/graph on animation iterations.
	 */
	Hypergraph.prototype.step = function() {
		 //log('Interval ' + STEPS);
		 //if (STEPS === this.interval_count - 1) {
		 //    window.clearInterval(this.interval);
		 //    log('Done with intervals');
		 //    return;
		 //}

		 //++STEPS;

		 //console.info(this);

		 //this.frequency.node
		 //    .transition()
		 //    .duration(D3_TRANSITION_DURATION)
		 //    .attr('r', function(d) {
		 //   	 if (d.intervals[STEPS].percentage >= this.threshold) {
		 //   		 return normalize(d.intervals[STEPS].percentage);
		 //   	 } else {
		 //   		 return FREQUENCY_HIDE_SIZE;
		 //   	 }				
		 //    }.bind(this));

		 //this.frequency.value
		 //    .text(function(d) {
		 //   	 return d.intervals[STEPS].percentage + '%';
		 //    }.bind(this))
		 //    .style('opacity', function(d) {
		 //   	 return d.intervals[STEPS].percentage >= this.threshold ? 1 : 0;
		 //    }.bind(this));
	};

	/**
	 * Start Hypergraph on DOMContentLoaded.
	 */
	document.addEventListener('DOMContentLoaded', function() {
		log('DOMContentLoaded');

		(new Hypergraph(document.querySelector('.graph'))).load();
	});
})(window, document, d3);