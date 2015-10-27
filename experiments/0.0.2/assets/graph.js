(function (document, window, d3, undefined) {
	'use strict';

	function Graph(el) {
		this.w = el.offsetWidth;
		this.h = window.innerHeight;
		this.z = d3.scale.category20c();


		this.draw();
	}

	Graph.prototype.draw = function () {
		var force = d3.layout.force().size([this.w, this.h]),
			svg = d3.select('.js-graph').append('svg:svg').attr('width', this.w).attr('height', this.h);


		d3.json('data.json', function (json) {

			var links = [
				{
					source: json.nodes.attr[0],
					target: json.nodes.attr[2]
				},
				{
					source: json.nodes.attr[1],
					target: json.nodes.attr[2]
				},
				{
					source: json.nodes.attr[1],
					target: json.nodes.attr[1]
				},
				{
					source: json.nodes.attr[2],
					target: json.nodes.attr[1]
				},
				{
					source: json.nodes.attr[2],
					target: json.nodes.attr[2]
				},
				{
					source: json.nodes.attr[2],
					target: json.nodes.attr[0]
				},
				{
					source: json.nodes.attr[3],
					target: json.nodes.attr[0]
				}
			];

			force
				.nodes(json.nodes.attr)
				.links(links)
				.start();

			var link = svg.selectAll('line')
				.data(links)
				.enter()
				.insert('svg:line')
				.style('stroke', '#999')
				.style('stroke-width', '1px');

			var nodes = svg.selectAll('.node')
				.data(json.nodes.attr)
				.enter()
				.append(function() {
					console.log(arguments);
					return 'svg:circle';
				}())
				.attr('r', 4.5)
				.style('fill', '#09C')
				.style('stroke', '#000')
				.call(force.drag);

			var freq = nodes.selectAll('circle')
				.attr('r', 4.5);

			var attr = nodes.selectAll('rect')
				.attr('width', 80)
				.attr('height', 20);


			force.on('tick', function() {
				link
					.attr('x1', function(d) { return d.source.x; })
					.attr('y1', function(d) { return d.source.y; })
					.attr('x2', function(d) { return d.target.x; })
					.attr('y2', function(d) { return d.target.y; })

				nodes
					.attr('cx', function(d) { return d.x; })
					.attr('cy', function(d) { return d.y; });

			});
		});


	};

	function main() {
		var graph = new Graph(document.querySelector('.js-graph'));
	}

	main();

})(document, window, d3);