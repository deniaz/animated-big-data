var GraphBuilder = (function() {
	_nodes = [];

	function add(el) {
		_nodes.push(el);
	}

	function getNodes() {
		return [
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
		]
	}

	function getLinks() {}

	function buildFromArray(arr) {

	}

	return {
		add: add,
		getNodes: getNodes,
		getLinks: getLinks,
		buildFromArray: buildFromArray,
	};
})();