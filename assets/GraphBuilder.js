var GraphBuilder = (function() {
	var _nodes = [
		{
			x: 150,
			y: 150,
			r: 40,
			color: 'deepskyblue',
			label: 'foo',
			type: 'frequency'
		},
		{
			x: 300,
			y: 250,
			width: 250,
			height: 60,
			color: 'deeppink',
			label: 'bar',
			type: 'attribute'
		}
	];

	var _links = [
		{
			source: _nodes[0],
			target: _nodes[1]
		}
	]

	function add(el) {
		_nodes.push(el);
	}

	function getNodes() {
		return _nodes;
	}

	function getLinks() {
		return _links;
	}

	function buildFromArray(arr) {

	}

	return {
		add: add,
		getNodes: getNodes,
		getLinks: getLinks,
		buildFromArray: buildFromArray,
	};
})();