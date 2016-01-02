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
	var D3_ATTRIBUTE_WIDTH = 120;

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
	
	var ATTRIBUTE_PADDING = 15;
	var ATTRIBUTE_TEXT_SIZE = 10;
	var FREQUENCY_PADDING = 100;
	var FREQUENCY_HIDE_SIZE = 5;
	var COLLISION_PADDING = 5;
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
		//if (target.type !== 'frequency') {
		//	this.links.push({
		//		source: source,
		//		target: target
		//	})
	    //}
	    this.links.push({
	        source: source,
	        target: target
	    })
	};

	function AttributeBuilder() {
	    this.attributes = [];
	}

	AttributeBuilder.prototype.getKey = function (el) {
	    for (var i = 0; i < this.attributes.length; i++) {
	        var a = this.attributes[i];
	        if (!!a.id && !!el.id && a.id === el.id) {
	            return i;
	        }
	    }
	    throw Error('Element not foung.');
	}

	AttributeBuilder.prototype.contains = function (el) {
	    try {
	        this.getKey(el);
	        return true;
	    } catch (e) {
	        return false;
	    }
	}

	AttributeBuilder.prototype.add = function (el) {
	    if (!this.contains(el)) {
	        this.attributes.push(el);
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

	function compareSubGraph(a, b) {
	    var numberOfEqual = 0;
	    for (var i = 0; i < a.attributes.length; i++) {
	        for (var j = 0; j < b.attributes.length; j++) {
	            if (b.attributes[j].id == a.attributes[i].id) {
	                numberOfEqual++;
	                break;
	            }
	        }
	    }
	    return numberOfEqual;
	}

	/**
	 * AJAX Callback. Sets data as Hypergraph properties.
	 * @param data JSON Graph Data
	 */
	Hypergraph.prototype.loaded = function(data) {
		log('Data loaded');
		this.interval_frequency = data.interval_frequency;
		this.interval_count = data.interval_count;
		this.threshold = data.threshold;
		this.numberOfAttributes = data.number_of_attributes;
		this.numberOfFrequencies = data.number_of_frequencies;

		var subGraphs = data.subGraphs;
		var comparisonList = [];

        // Compare all Frequencies (quantity of same attribute)
		for (var i = 0; i < subGraphs.length - 1; i++) {
		    for (var j = i + 1; j < subGraphs.length; j++) {
		        var result = {
		            indexA: i,
		            indexB: j,
		            equal: compareSubGraph(subGraphs[i], subGraphs[j])
		        }
		        comparisonList.push(result);		        
		    }
		}
		
		comparisonList.sort(function (a, b) {
		    if (a.equal < b.equal)
		        return 1;
		    if (a.equal > b.equal)
		        return -1;
		    return 0;
		});

		var nodeBuilder = new GraphBuilder(),
            tempBuilder,
            attributeLength = (this.numberOfAttributes * D3_ATTRIBUTE_WIDTH) + ((this.numberOfAttributes - 1) * ATTRIBUTE_PADDING),
            positionX = (this.width - attributeLength) / 2,
            positionY = (this.height - D3_ATTRIBUTE_HEIGHT) / 2,
            frequencies = [];

		for (var i = 0; i < comparisonList.length; i++) {

		    var nodeGroup = comparisonList[i],
                frequencyA = subGraphs[nodeGroup.indexA].frequency,
                frequencyB = subGraphs[nodeGroup.indexB].frequency;

		    // if (frequencies contains A or B => false)
		    var condition = false;		    
		    for (var j = 0; j < frequencies.length; j++) {
		        if (frequencies[j].frequency.label == frequencyA.label || frequencies[j].frequency.label == frequencyB.label) {
		            condition = true;
		            break;
		        }		            
		    }

		    if (!condition) {
		        var tempBuilder = new AttributeBuilder();

		        for (var j = 0; j < subGraphs[nodeGroup.indexA].attributes.length; j++) {
		            tempBuilder.add(subGraphs[nodeGroup.indexA].attributes[j]);
		        }

		        for (var j = 0; j < subGraphs[nodeGroup.indexB].attributes.length; j++) {
		            tempBuilder.add(subGraphs[nodeGroup.indexB].attributes[j]);
		        }

		        tempBuilder.attributes.sort(function (a, b) {
		            if (a.numberOfLinks > b.numberOfLinks)
		                return 1;
		            if (a.numberOfLinks < b.numberOfLinks)
		                return -1;
		            return 0;
		        });

		        var groupPositionX = positionX;

		        for (var j = 0; j < tempBuilder.attributes.length; j++) {
		            if (!nodeBuilder.containsNode(tempBuilder.attributes[j])) {
		                tempBuilder.attributes[j].x = positionX;
		                tempBuilder.attributes[j].y = positionY;

		                positionX += D3_ATTRIBUTE_WIDTH + ATTRIBUTE_PADDING;
		                nodeBuilder.addNode(tempBuilder.attributes[j]);
		            }
		        }

		        var frequencyPositionX = (groupPositionX + (tempBuilder.attributes.length * D3_ATTRIBUTE_WIDTH) + ((tempBuilder.attributes.length - 1) * ATTRIBUTE_PADDING)) / 2;

		        frequencyA.x = frequencyPositionX;
		        frequencyA.y = positionY - (normalize(frequencyA.intervals[STEPS].percentage) + FREQUENCY_PADDING)
		        frequencies.push(subGraphs[nodeGroup.indexA]);

		        frequencyB.x = frequencyPositionX;
		        frequencyB.y = positionY + (normalize(frequencyB.intervals[STEPS].percentage) + FREQUENCY_PADDING + D3_ATTRIBUTE_HEIGHT);
		        frequencies.push(subGraphs[nodeGroup.indexB]);
		    }
		}

		if ((this.numberOfFrequencies % 2) != 0) {
		    for (var i = 0; i < subGraphs.length; i++) {
		        var found = false;
		        for (var j = 0; j < frequencies.length; j++) {
		            if (subGraphs[i].frequency.label == frequencies[j].frequency.label)
		                found = true;
		        }
		        if (!found) {
		            var tempBuilder = new AttributeBuilder();

		            for (var j = 0; j < subGraphs[i].attributes.length; j++) {
		                tempBuilder.add(subGraphs[i].attributes[j]);
		            }

		            tempBuilder.attributes.sort(function (a, b) {
		                if (a.numberOfLinks > b.numberOfLinks)
		                    return 1;
		                if (a.numberOfLinks < b.numberOfLinks)
		                    return -1;
		                return 0;
		            });

		            var groupPositionX = positionX,
                        numberOfAttributes = 0;

		            for (var j = 0; j < tempBuilder.attributes.length; j++) {
		                if (!nodeBuilder.containsNode(tempBuilder.attributes[j])) {
		                    tempBuilder.attributes[j].x = positionX;
		                    tempBuilder.attributes[j].y = positionY;

		                    positionX += D3_ATTRIBUTE_WIDTH + ATTRIBUTE_PADDING;
		                    nodeBuilder.addNode(tempBuilder.attributes[j]);
		                    numberOfAttributes++;
		                }
		            }

		            //var frequencyPositionX = (groupPositionX + (numberOfAttributes * D3_ATTRIBUTE_WIDTH) + ((numberOfAttributes - 1) * ATTRIBUTE_PADDING)) / 2;
		            var frequencyPositionX = ((positionX - groupPositionX) / 2) + groupPositionX;

		            subGraphs[i].frequency.x = frequencyPositionX;
		            subGraphs[i].frequency.y = positionY - (normalize(subGraphs[i].frequency.intervals[STEPS].percentage) + FREQUENCY_PADDING)
		            frequencies.push(subGraphs[i]);
		        }
		    }
		}

		for (var i = 0; i < frequencies.length; i++) {
		    for (var j = 0; j < frequencies[i].attributes.length; j++) {
		        //nodeBuilder.link(frequencies[i].frequency, frequencies[i].attributes[j]);
		        nodeBuilder.link(frequencies[i].frequency, nodeBuilder.nodes[nodeBuilder.getKey(frequencies[i].attributes[j])]);
		    }
		    nodeBuilder.addNode(frequencies[i].frequency);
		}

		this.nodes = nodeBuilder.nodes;
		this.links = nodeBuilder.links;

		//var builder = new GraphBuilder();

		//for (var i = 0; i < data.nodes.length; i++) {
		//	var subGraph = data.nodes[i].data,
		//		frequency = subGraph[subGraph.length - 1];

		//	for (var j = 0; j < subGraph.length; j++) {
		//		var node = builder.addNode(subGraph[j]);
		//		builder.link(frequency, node);
		//	}
		//}

		//this.nodes = builder.nodes;
		//this.links = builder.links;

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

	    // https://jsfiddle.net/NovasTaylor/o1qesn6k/
		var drag = this.force.drag()
                .on("dragstart", dragstart);

		this.frequency = {
			node: svg.selectAll('g')
				.data(this.nodes)
				.enter()
				.append('g')
				.attr('class', function(d) {
					return d.type;
				})
				//.call(this.force.drag)
                .call(drag)
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
		    node: svg.selectAll('.attribute')
                .append('rect')
                .call(drag),
		    label: svg.selectAll('.attribute')
                .append('text')
                .style({"font-size":"10px"})
                .text(function (d) {
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

	function dragstart(d) {
	    d3.select(this).classed("fixed", d.fixed = true); // TODO: <= d.fixed = true eventuell anders hinkriegen
	}

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

		this.frequency.node
			.attr('cx', function (d) {
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
				return d.target.x + (D3_ATTRIBUTE_WIDTH / 2);
			})
			.attr('y2', function(d) {
				return d.target.y + (D3_ATTRIBUTE_HEIGHT / 2);
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