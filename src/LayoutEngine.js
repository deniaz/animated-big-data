/**
 * LayoutEngine Module.
 *
 * LayoutEngine using the Revealing Module Pattern.
 *
 * This module builds the Layout of the Hypergraph.
 */
var LayoutEngine = (function() {
	'use strict';

	/**
	 * The Width of all Attributes
	 *
	 * @type {number}
	 * @private
	 */
	var ATTRIBUTE_WIDTH = 120;

	/**
	 * The Height of all Attributes
	 *
	 * @type {number}
	 * @private
	 */
	var ATTRIBUTE_HEIGHT = 45;

	/**
	 * The Padding between two Attributes
	 *
	 * @type {number}
	 * @private
	 */
	var ATTRIBUTE_PADDING = 15;

	/**
	 * The Padding between two Frequencies
	 *
	 * @type {number}
	 * @private
	 */
	var FREQUENCY_PADDING = 50;

	function InternalGraphBuilder() {
		this.nodes = [];
		this.links = [];
	}

	InternalGraphBuilder.prototype.getKey = function(el) {
		for (var i = 0; i < this.nodes.length; i++) {
			var n = this.nodes[i];
			if (!!n.id && !!el.id && n.id === el.id) {
				return i;
			}
		}

		throw Error('Element not found.');
	};

	InternalGraphBuilder.prototype.containsNode = function(el) {
		try {
			this.getKey(el);
			return true;
		} catch (e) {
			return false;
		}
	};

	InternalGraphBuilder.prototype.addNode = function(el) {
		if (this.containsNode(el)) {
			return this.nodes[this.getKey(el)];
		} else {
			return this.nodes[this.nodes.push(el) - 1];
		}
	};

	InternalGraphBuilder.prototype.link = function(source, target) {
		this.links.push({
			source: source,
			target: target
		});
	};

	var _nodes = [];

	var _links = [];

	var _subGraphs;

	var _width;

	var _height;

	var _normalize;

	var _singleLinkedAttributes = [];

	var _multipleLinkedAttributes = new InternalGraphBuilder();

	var _frequencies = [];

	function getNodes() {
		return _nodes;
	}

	function getLinks() {
		return _links;
	}

	/**
	 * builds the Layout of the Hypergraph
	 *
	 * @param {object} graphData - serialized graph data
	 * @param {number} width - Width of the display
	 * @param {number} height - Heigth of the display
	 */
	function buildFromArray(graphData, width, height, normalize) {
		_subGraphs = convertData(graphData);
		_width = width;
		_height = height;
		_normalize = normalize;

		var comparisonList = compareAllSubGraphs();
		var subGraphGroups = getSubGraphGroups(comparisonList);
		createSortedAttributLists(subGraphGroups);

		var nodeBuilder = new InternalGraphBuilder();
		calculateKoordinates(nodeBuilder);

		linkAllNodes(nodeBuilder);

		_nodes = nodeBuilder.nodes;
		_links = nodeBuilder.links;
	}

	/**
	 * Converts the Json data.
	 *
	 * @param graphData - serialized Json input
	 * @returns {object} - List of all subGraphs
	 */
	function convertData(graphData) {
		var attributeBuilder = new InternalGraphBuilder();
		var convertedSubGraph = [];

		graphData.forEach(function(subgraph) {
			var frequency = subgraph[subgraph.length - 1],
				attributes = [];

			for (var i = 0; i < subgraph.length - 1; i++) {
				var attribute;
				if (attributeBuilder.containsNode(subgraph[i])) {
					attribute = attributeBuilder.nodes[attributeBuilder.getKey(subgraph[i])];
					attribute.numberOfLinks++;
				} else {
					attribute = attributeBuilder.nodes[attributeBuilder.nodes.push(subgraph[i]) - 1];
					attribute.numberOfLinks = 1;
				}

				attributes.push(attribute);
			}
			convertedSubGraph.push({
				frequency: frequency,
				attributes: attributes
			});
		});

		return convertedSubGraph;
	}

	/**
	 * Compares all SubGraphs on their quantity of same attributes and sort them.
	 *
	 * @returns {number}
	 */
	function compareAllSubGraphs() {
		var comparisonList = [];
		for (var i = 0; i < _subGraphs.length - 1; i++) {
			for (var j = i + 1; j < _subGraphs.length; j++) {
				var result = {
					indexA: i,
					indexB: j,
					equal: countEqualAttributes(_subGraphs[i], _subGraphs[j])
				};
				comparisonList.push(result);
			}
		}

		// Add array index to every element in the array.
		// You'll see why.
		comparisonList.forEach(function(el, i) {
			el.index = i;
		});

		comparisonList.sort(function(a, b) {
			if (a.equal < b.equal)
				return 1;
			if (a.equal > b.equal)
				return -1;

			// If both elements have the same amount of equal, sort by the elements position in the array.
			// This guarantees a stable sort and consistent results across browsers (looking at you, Chrome).
			if (a.index < b.index)
				return -1;

			if (a.index > b.index)
				return 1;

			return 0;
		});

		return comparisonList;
	}

	/**
	 * Counts the number of the same attributes.
	 *
	 * @param a - subGraph A to compare
	 * @param b - subGraph B to compare
	 * @returns {number}
	 */
	function countEqualAttributes(a, b) {
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
	 * Finds all subGraphGroups
	 *
	 * @param comparisonList - List with all possible subGraph combinations
	 * @returns {object}
	 */
	function getSubGraphGroups(comparisonList) {
		var subGraphGroups = [];

		for (var i = 0; i < comparisonList.length; i++) {
			var nodeGroup = comparisonList[i],
				frequencyA = _subGraphs[nodeGroup.indexA].frequency,
				frequencyB = _subGraphs[nodeGroup.indexB].frequency;

			var containsFrequency = false;
			for (var j = 0; j < _frequencies.length; j++) {
				if (_frequencies[j].frequency.label == frequencyA.label || _frequencies[j].frequency.label == frequencyB.label) {
					containsFrequency = true;
					break;
				}
			}

			// if (_frequencies contains A or B => true)
			if (!containsFrequency) {
				subGraphGroups.push(createSubGraphGroup(_subGraphs[nodeGroup.indexA], _subGraphs[nodeGroup.indexB]));
			}
		}

		// if there are an odd number of frequencies, the single subGraph has to be added too
		if ((_subGraphs.length % 2) !== 0) {
			for (var i = 0; i < _subGraphs.length; i++) {
				var frequencyFound = false;
				for (var j = 0; j < _frequencies.length; j++) {
					if (_subGraphs[i].frequency.label == _frequencies[j].frequency.label) {
						frequencyFound = true;
						break;
					}
				}
				if (!frequencyFound) {

					subGraphGroups.push(createSubGraphGroup(_subGraphs[i], null));
				}
			}
		}

		return subGraphGroups;
	}

	/**
	 * Creates a subGraphGroup
	 *
	 * @param {subGraph} subGraphA - subGraph to add to the group
	 * @param {subGraph} subGraphB - subGraph to add to the group
	 * @returns {object}
	 */
	function createSubGraphGroup(subGraphA, subGraphB) {
		var subGraphGroup = {
			subGraphA: subGraphA,
			subGraphB: subGraphB
		};

		_frequencies.push(subGraphGroup.subGraphA);

		if (subGraphGroup.subGraphB !== null) {
			_frequencies.push(subGraphGroup.subGraphB);
		}

		return subGraphGroup;
	}

	/**
	 * Creates sorted attribute lists
	 *
	 * @param subGraphGroups - all SubGraphGroups
	 */
	function createSortedAttributLists(subGraphGroups) {
		for (var i = 0; i < subGraphGroups.length; i++) {

			var attributes = subGraphGroups[i].subGraphA.attributes,
				tempMultipleLinkedAttributes = new InternalGraphBuilder();

			var sortedAttributes = sortAttributes(attributes, tempMultipleLinkedAttributes);
			_singleLinkedAttributes.push(sortedAttributes.single);

			if (subGraphGroups[i].subGraphB !== null) {
				attributes = subGraphGroups[i].subGraphB.attributes;
				sortedAttributes = sortAttributes(attributes, tempMultipleLinkedAttributes);
				_singleLinkedAttributes.push(sortedAttributes.single);
			}

			// Add array index to every element in the array.
			// You'll see why.
			sortedAttributes.multi.nodes.forEach(function(el, i) {
				el.index = i;
			});

			sortedAttributes.multi.nodes.sort(function(a, b) {
				if (a.numberOfLinks > b.numberOfLinks)
					return 1;
				if (a.numberOfLinks < b.numberOfLinks)
					return -1;

				// If both elements have the same amount of equal, sort by the elements position in the array.
				// This guarantees a stable sort and consistent results across browsers (looking at you, Chrome).
				if (a.index > b.index)
					return 1;

				if (a.index < b.index)
					return -1;

				return 0;
			});

			for (var j = 0; j < sortedAttributes.multi.nodes.length; j++) {
				_multipleLinkedAttributes.addNode(sortedAttributes.multi.nodes[j]);
			}
		}

	}

	/**
	 * Sorts the attributes based on their link levels
	 *
	 * @param attributes - all attributes of a subGraph
	 * @param {InternalGraphBuilder} tempMultipleLinkedAttributes
	 * @returns {object}
	 */
	function sortAttributes(attributes, tempMultipleLinkedAttributes) {
		var tempSingleLinkedAttributes = [];

		for (var j = 0; j < attributes.length; j++) {
			if (attributes[j].numberOfLinks == 1) {
				tempSingleLinkedAttributes.push(attributes[j]);
			} else {
				tempMultipleLinkedAttributes.addNode(attributes[j]);
			}
		}

		return {
			single: tempSingleLinkedAttributes,
			multi: tempMultipleLinkedAttributes
		};
	}

	/**
	 * Calculates the Coordinates of all nodes
	 *
	 * @param {InternalGraphBuilder} nodeBuilder - nodeBuilder to store the nodes
	 */
	function calculateKoordinates(nodeBuilder) {

		var fRadius = getMaxRadius(),
			x = getXKoordinates(fRadius),
			y = 0,
            lastY = 0,
            counter = 0;

	    // sets Koordinates of all frequencies
		for (var i = 0; i < _frequencies.length; i++) {
			var frequency = _frequencies[i].frequency;
			var singleAttr = _singleLinkedAttributes[i].length;

			// set X-Koordinate of the left side
			if (i % 2 === 0) {
				frequency.x = x.column2;
				for (var j = 0; j < singleAttr; j++) {
					_singleLinkedAttributes[i][j].x = x.column1;
				}
				// set X-Koordinate of the right side
			} else {
				frequency.x = x.column4;
				for (var j = 0; j < singleAttr; j++) {
					_singleLinkedAttributes[i][j].x = x.column5;
				}
			}

			if (counter === 2) {
			    counter = 0;
			    y += (2 * fRadius) + FREQUENCY_PADDING;
			}
			frequency.y = y;
			lastY = y;
			counter++;

			// sets Y-Koordinate of the singleLinkedAttributes
			var attrY = y - ((singleAttr * ATTRIBUTE_HEIGHT) + ((singleAttr - 1) * ATTRIBUTE_PADDING)) / 2;
			for (var j = 0; j < singleAttr; j++) {
				_singleLinkedAttributes[i][j].y = attrY;
				nodeBuilder.addNode(_singleLinkedAttributes[i][j]);

				attrY += ATTRIBUTE_HEIGHT + ATTRIBUTE_PADDING;
			}
			nodeBuilder.addNode(frequency);
		}

		var multiAttr = _multipleLinkedAttributes.nodes.length;
		y = (lastY / 2) - (((multiAttr * ATTRIBUTE_HEIGHT) + ((multiAttr - 1) * ATTRIBUTE_PADDING)) / 2);

	    // sets Koordinates of all multipleLinkAttributes (column 3)
	    for (var i = 0; i < _multipleLinkedAttributes.nodes.length; i++) {
	    	_multipleLinkedAttributes.nodes[i].x = x.column3;
	    	_multipleLinkedAttributes.nodes[i].y = y;
	    	y += ATTRIBUTE_HEIGHT + ATTRIBUTE_PADDING;

	    	nodeBuilder.addNode(_multipleLinkedAttributes.nodes[i]);
	    }

		// translate the Hypergraphe to the center of the display
		translateHypergraph(nodeBuilder, fRadius);
	}

	/**
	 * Returns the largest radius of all frequencies
	 *
	 * @returns {number} - the largest radius
	 */
	function getMaxRadius() {
		var fRadius = _normalize(_frequencies[0].frequency.intervals[0].percentage);
		for (var i = 0; i < _frequencies.length; i++) {
			for (var j = 0; j < _frequencies[i].frequency.intervals.length; j++) {
				var radius = _normalize(_frequencies[i].frequency.intervals[j].percentage);
				if (radius > fRadius)
				    fRadius = radius;
					
			}
		}
		return fRadius;
	}

	/**
	 * Returns a list with the X-Koordinates of the five layout-columns
	 *
	 * @param {number} radius - the largest radius
	 * @returns {object}
	 */
	function getXKoordinates(radius) {
		var x3 = (_width / 2) - (ATTRIBUTE_WIDTH / 2),
			x2 = x3 - FREQUENCY_PADDING - radius,
			x1 = x2 - radius - FREQUENCY_PADDING - ATTRIBUTE_WIDTH,
			x4 = x3 + ATTRIBUTE_WIDTH + FREQUENCY_PADDING + radius,
			x5 = x4 + radius + FREQUENCY_PADDING;
		return {
			column1: x1,
			column2: x2,
			column3: x3,
			column4: x4,
			column5: x5
		};
	}

	/**
	 * Translate the hypergraphe to the center of the display.
	 *
	 * @param {InternalGraphBuilder} nodeBuilder - nodeBuilder with the stored nodes
	 * @param {number} radius - the largest radius
	 */
	function translateHypergraph(nodeBuilder, radius) {

		// find the Y-Position of the last Node in the Hypergraph
		var index1 = _frequencies.length - 1,
			index2 = _singleLinkedAttributes[index1].length - 1,
			yPos = [];

		yPos.push(_singleLinkedAttributes[index1][index2].y + ATTRIBUTE_HEIGHT);
		yPos.push(_frequencies[_frequencies.length - 1].frequency.y + radius);
		yPos.push(_multipleLinkedAttributes.nodes[_multipleLinkedAttributes.nodes.length - 1].y + ATTRIBUTE_HEIGHT);
		if (_frequencies.length > 1) {
			index1 = _frequencies.length - 2;
			index2 = _singleLinkedAttributes[index1].length - 1;
			yPos.push(_singleLinkedAttributes[index1][index2].y + ATTRIBUTE_HEIGHT);
			yPos.push(_frequencies[_frequencies.length - 2].frequency.y + radius);
		}

		var lastY = yPos[0];
		for (var i = 1; i > yPos.length; i++) {
			if (yPos[i] > lastY)
				lastY = yPos[i];
		}

		// translate all Nodes
		var translation = (_height - lastY) / 2;
		for (var i = 0; i < nodeBuilder.nodes.length; i++) {
			nodeBuilder.nodes[i].y += translation;
		}
	}

	/**
	 * link all attributes with their frequencies.
	 *
	 * @param {InternalGraphBuilder} nodeBuilder - nodeBuilder with the stored nodes
	 */
	function linkAllNodes(nodeBuilder) {
		for (var i = 0; i < _frequencies.length; i++) {
			for (var j = 0; j < _frequencies[i].attributes.length; j++) {
				nodeBuilder.link(_frequencies[i].frequency, nodeBuilder.nodes[nodeBuilder.getKey(_frequencies[i].attributes[j])]);
			}
		}
	}

	return {
		getNodes: getNodes,
		getLinks: getLinks,
		buildFromArray: buildFromArray
	};
})();