var GraphBuilder = (function() {
	'use strict';

	var D3_ATTRIBUTE_WIDTH = 120;

	var D3_ATTRIBUTE_HEIGHT = 45;
	var FONT_SIZE = 11;
	var ATTRIBUTE_PADDING = 15;
	var ATTRIBUTE_TEXT_SIZE = 10;
	var FREQUENCY_PADDING = 50;
	var FREQUENCY_HIDE_SIZE = 5;
	var COLLISION_PADDING = 5;


	function normalize(n) {
		return Math.pow(n, 4) / 30;
	}

	function AttributeBuilder() {
		this.attributes = [];
	}

	AttributeBuilder.prototype.getKey = function(el) {
		for (var i = 0; i < this.attributes.length; i++) {
			var a = this.attributes[i];
			if (!!a.id && !!el.id && a.id === el.id) {
				return i;
			}
		}
		throw Error('Element not foung.');
	}

	AttributeBuilder.prototype.contains = function(el) {
		try {
			this.getKey(el);
			return true;
		} catch (e) {
			return false;
		}
	}

	AttributeBuilder.prototype.add = function(el) {
		if (!this.contains(el)) {
			this.attributes.push(el);
		}
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

	var _nodes = [];

	var _links = [];

	function getNodes() {
		return _nodes;
	}

	function getLinks() {
		return _links;
	}

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


	function buildFromArray(subGraphs, width, height) {
		var comparisonList = [];
		var numberOfFrequencies = subGraphs.length;

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

		comparisonList.sort(function(a, b) {
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

		if ((numberOfFrequencies % 2) != 0) {
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

			tempMultipleLinkedAttributes.attributes.sort(function(a, b) {
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
		var x3 = (width / 2) - (D3_ATTRIBUTE_WIDTH / 2),
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

		var translation = (height - lastY) / 2
		for (var i = 0; i < nodeBuilder.nodes.length; i++) {
			nodeBuilder.nodes[i].y += translation;
		}

		for (var i = 0; i < frequencies.length; i++) {
			for (var j = 0; j < frequencies[i].attributes.length; j++) {
				nodeBuilder.link(frequencies[i].frequency, nodeBuilder.nodes[nodeBuilder.getKey(frequencies[i].attributes[j])]);
			}
		}

		_nodes = nodeBuilder.nodes;
		_links = nodeBuilder.links;

	}

	return {
		getNodes: getNodes,
		getLinks: getLinks,
		buildFromArray: buildFromArray
	};
})();