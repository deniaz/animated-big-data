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
	var D3_ATTRIBUTE_HEIGHT = 45;

	/**
	 * Transition Duration
	 * @type {number}
	 */
	var D3_TRANSITION_DURATION = 500;
	
	var FONT_SIZE = 11;
	var ATTRIBUTE_PADDING = 15;
	var ATTRIBUTE_TEXT_SIZE = 10;
	var FREQUENCY_PADDING = 50;
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
		return Math.pow(n, 4) / 30;
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

	Hypergraph.prototype.calculateGraphLayout = function (subGraphs) {
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

	    var frequencies = [],
	        subGraphGroups = [];

	    for (var i = 0; i < comparisonList.length; i++) {
	        var nodeGroup = comparisonList[i],
                frequencyA = subGraphs[nodeGroup.indexA].frequency,
                frequencyB = subGraphs[nodeGroup.indexB].frequency;

	        var condition = false;
	        for (var j = 0; j < frequencies.length; j++) {
	            if (frequencies[j].frequency.label == frequencyA.label || frequencies[j].frequency.label == frequencyB.label) {
	                condition = true;
	                break;
	            }
	        }

	        // if (frequencies contains A or B => false)
	        if (!condition) {
	            var item = {
	                subGraphA: subGraphs[nodeGroup.indexA],
	                subGraphB: subGraphs[nodeGroup.indexB]
	            }
	            subGraphGroups.push(item);
	            frequencies.push(item.subGraphA);
	            frequencies.push(item.subGraphB);
	        }
	    }

	    if ((this.numberOfFrequencies % 2) != 0) {
	        for (var i = 0; i < subGraphs.length; i++) {
	            var found = false;
	            for (var j = 0; j < frequencies.length; j++) {
	                if (subGraphs[i].frequency.label == frequencies[j].frequency.label) {
	                    found = true;
	                    break;
	                }
	            }
	            if (!found) {
	                var item = {
	                    subGraphA: subGraphs[i],
	                    subGraphB: null
	                }
	                subGraphGroups.push(item);
	                frequencies.push(item.subGraphA);
	            }
	        }
	    }

	    var singleLinkedAttributes = [],
            multipleLinkedAttributes = new AttributeBuilder();

	    for (var i = 0; i < subGraphGroups.length; i++) {

	        var attributes = subGraphGroups[i].subGraphA.attributes,
                tempSingleLinkedAttributes = [],
                tempMultipleLinkedAttributes = new AttributeBuilder();

	        for (var j = 0; j < attributes.length; j++) {
	            if (attributes[j].numberOfLinks == 1) {
	                tempSingleLinkedAttributes.push(attributes[j]);
	            } else {
	                tempMultipleLinkedAttributes.add(attributes[j]);
	            }
	        }
	        singleLinkedAttributes.push(tempSingleLinkedAttributes);

	        if (subGraphGroups[i].subGraphB != null) {
	            attributes = subGraphGroups[i].subGraphB.attributes;
	            tempSingleLinkedAttributes = [];

	            for (var j = 0; j < attributes.length; j++) {
	                if (attributes[j].numberOfLinks == 1) {
	                    tempSingleLinkedAttributes.push(attributes[j]);
	                } else {
	                    tempMultipleLinkedAttributes.add(attributes[j]);
	                }
	            }

	            singleLinkedAttributes.push(tempSingleLinkedAttributes);
	        }

	        tempMultipleLinkedAttributes.attributes.sort(function (a, b) {
	            if (a.numberOfLinks > b.numberOfLinks)
	                return 1;
	            if (a.numberOfLinks < b.numberOfLinks)
	                return -1;
	            return 0;
	        });

	        for (var j = 0; j < tempMultipleLinkedAttributes.attributes.length; j++) {
	            multipleLinkedAttributes.add(tempMultipleLinkedAttributes.attributes[j]);
	        }
	    }

	    var fRadius = normalize(frequencies[0].frequency.intervals[0].percentage);
	    for (var i = 0; i < frequencies.length; i++) {
	        for (var j = 0; j < frequencies[i].frequency.intervals.length; j++) {
	            var radius = normalize(frequencies[i].frequency.intervals[j].percentage);
	            if (radius > fRadius)
	                fRadius = radius;
	        }
	    }

        // calculate X-Koordinates
	    var x3 = (this.width / 2) - (D3_ATTRIBUTE_WIDTH / 2),
            x2 = x3 - FREQUENCY_PADDING - fRadius,
            x1 = x2 - fRadius - FREQUENCY_PADDING - D3_ATTRIBUTE_WIDTH,
            x4 = x3 + D3_ATTRIBUTE_WIDTH + FREQUENCY_PADDING + fRadius,
            x5 = x4 + fRadius + FREQUENCY_PADDING;

        // calculate Y-Koordinates
	    var lastY = 0,
            y = 0,
            nodeBuilder = new GraphBuilder();

	    for (var i = 0; i < multipleLinkedAttributes.attributes.length; i++) {
	        multipleLinkedAttributes.attributes[i].x = x3;
	        multipleLinkedAttributes.attributes[i].y = y;
	        y += D3_ATTRIBUTE_HEIGHT + ATTRIBUTE_PADDING;

	        nodeBuilder.addNode(multipleLinkedAttributes.attributes[i]);
	    }

	    var multiAttr = multipleLinkedAttributes.attributes.length;
	    y = ((multiAttr * D3_ATTRIBUTE_HEIGHT) + ((multiAttr - 1) * ATTRIBUTE_PADDING)) / 2;

	    for (var i = 0; i < frequencies.length; i++) {
	        var frequency = frequencies[i].frequency;
	        var singleAttr = singleLinkedAttributes[i].length;
	        if (i % 2 == 0) {
	            frequency.x = x2;
	            for (var j = 0; j < singleAttr; j++) {
	                singleLinkedAttributes[i][j].x = x1;
	            }
	        } else {
	            frequency.x = x4;
	            for (var j = 0; j < singleAttr; j++) {
	                singleLinkedAttributes[i][j].x = x5;
	            }
	        }

	        if (i >= 2) {
	            y += (2 * fRadius) + FREQUENCY_PADDING;
	        }
	        frequency.y = y;

	        var attrY = y - ((singleAttr * D3_ATTRIBUTE_HEIGHT) + ((singleAttr - 1) * ATTRIBUTE_PADDING)) / 2;
	        for (var j = 0; j < singleAttr; j++) {	            
	            singleLinkedAttributes[i][j].y = attrY;
	            nodeBuilder.addNode(singleLinkedAttributes[i][j]);

	            attrY += D3_ATTRIBUTE_HEIGHT + ATTRIBUTE_PADDING;
	        }
	        nodeBuilder.addNode(frequency);
	    }

	    var y1 = singleLinkedAttributes[frequencies.length - 1][singleAttr - 1].y + D3_ATTRIBUTE_HEIGHT,
            y2 = frequencies[frequencies.length - 1].frequency.y + fRadius;

	    if (y1 > y2) {
	        lastY = y1
	    } else {
	        lastY = y2;
	    }   

	    var translation = (this.height - lastY) / 2
	    for (var i = 0; i < nodeBuilder.nodes.length; i++) {
	        nodeBuilder.nodes[i].y += translation;
	    }        

	    for (var i = 0; i < frequencies.length; i++) {
	        for (var j = 0; j < frequencies[i].attributes.length; j++) {
	            nodeBuilder.link(frequencies[i].frequency, nodeBuilder.nodes[nodeBuilder.getKey(frequencies[i].attributes[j])]);
	        }
	    }

	    this.nodes = nodeBuilder.nodes;
	    this.links = nodeBuilder.links;
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
        // TODO: numberOfAttributes eventuell entfernen
		this.numberOfAttributes = data.number_of_attributes;
		this.numberOfFrequencies = data.number_of_frequencies;

		var subGraphs = data.subGraphs;
		
		this.calculateGraphLayout(subGraphs);

		this.draw();
	};

	/**
	 * Draws the graph.
	 */
	Hypergraph.prototype.draw = function() {
		log('Init Graph Drawing');

		var svg = this.svg =
			d3
				.select('main')
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
				return d.intervals[STEPS].percentage.toFixed(2) + '%';
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
                .style({"font-size": FONT_SIZE + 'px'})
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
					return normalize(d.intervals[STEPS].percentage).toFixed(2);
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
		    return 'translate(' + (d.x - 23) + ', ' + d.y + ')';
		});

		this.svg.selectAll('.attribute text').attr('transform', function(d) {
			return 'translate(' + (d.x + 10) + ', ' + (d.y + 25) + ')';
		});
	};

	/**
	 * Adjusts node/graph on animation iterations.
	 */
	Hypergraph.prototype.step = function() {

	};

	/**
	 * Start Hypergraph on DOMContentLoaded.
	 */
	document.addEventListener('DOMContentLoaded', function() {
		log('DOMContentLoaded');

		(new Hypergraph(document.querySelector('main'))).load();
	});
})(window, document, d3);