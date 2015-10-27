(function(d3) {
	var el = document.querySelector('.js-graph'),
		w = el.offsetWidth,
		h = window.innerHeight,
		graph = d3.select('.js-graph').append('svg');
	graph.attr('width', w).attr('height', h);

	var
		attributes = [{ x: 20, y: 20}],
		multiAttributes = [{x: 70, y: 80}, {x: 125, y: 80}, {x: 90, y: 120}],
		links = [
			{ source: multiAttributes[0], target: multiAttributes[1] },
			{ source: multiAttributes[0], target: multiAttributes[2] },
			{ source: multiAttributes[1], target: multiAttributes[2] },
			{ source: multiAttributes[0], target: attributes[0] }
		];

	graph
		.selectAll('circle.multiAttributes')
		.data(multiAttributes)
		.enter()
		.append('svg:circle')
		.attr('cx', function(d) { return d.x; })
		.attr('cy', function(d) { return d.y; })
		.attr('r', '10px')
		.attr('fill', 'deepskyblue');

	graph.
		selectAll('rect')
		.data(attributes)
		.enter()
		.append('rect')
		.attr('x', function(d) { return d.x; })
		.attr('y', function(d) { return d.y; })
		.attr('width', '80px')
		.attr('height', '20px')
		.attr('fill', 'deepskyblue');


	graph
		.selectAll('.line')
		.data(links)
		.enter()
		.append('line')
		.attr('x1', function(d) { return d.source.x; })
		.attr('y1', function(d) { return d.source.y; })
		.attr('x2', function(d) { return d.target.x; })
		.attr('y2', function(d) { return d.target.y; })
		.style('stroke', 'deepskyblue');
})(d3);