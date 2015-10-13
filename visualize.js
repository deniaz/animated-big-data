(function (document, d3, undefined) {
	'use strict';

	function Graph() {
		this.w = 800;
		this.h = 600;
		this.z = d3.scale.category20c();


		this.draw();
	}

	Graph.prototype.draw = function () {
		var force = d3.layout.force().size([this.w, this.h]),
			svg = d3.select('main').append('svg:svg').attr('width', this.w).attr('height', this.h);

		var circleData = [
			{
				radius: 40,
				color: '#2980b9',
				percentage: 84.9
			},
			{
				radius: 30,
				color: '#2980b9',
				percentage: 39.2
			}
		];
		var rectData = [
			{
				w: 100,
				h: 60,
				color: '#c0392b',
				type: 'Bier'
			},
			{
				w: 175,
				h: 60,
				color: '#c0392b'
				,
				type: 'Bürli'
			},
			{
				w: 125,
				h: 60,
				color: '#c0392b',
				type: 'Brodworscht'
			}
		];

		var forceData = circleData.concat(rectData);

		var linkData = [
			{
				source: forceData[0],
				target: forceData[1]
			},
			{
				source: forceData[1],
				target: forceData[2]
			},
			{
				source: forceData[2],
				target: forceData[0]
			},
			{
				source: forceData[0],
				target: forceData[3]
			},
			{
				source: forceData[2],
				target: forceData[4]
			},
			{
				source: forceData[2],
				target: forceData[4]
			}
		];

		force
			.nodes(forceData)
			.links(linkData)
			.charge(-100)
			.linkDistance(400)
			.start();

		var circleGroups = svg
			.selectAll('g')
			.data(circleData)
			.enter()
			.append('g')
			.attr('class', 'frequency')
			.call(force.drag)
			.on('mousedown', function() { d3.event.stopPropagation(); });

		var circles = circleGroups.append('circle');

		var rectGroups = svg
			.selectAll('g')
			.data(rectData)
			.enter()
			.append('g')
			.attr('class', 'eigenschaft')
			.call(force.drag)
			.on('mousedown', function() { d3.event.stopPropagation(); });

		var rects = svg.selectAll('.eigenschaft').append('rect');

		//
		//var rects = svg
		//	.selectAll('rect')
		//	.data(rectData)
		//	.enter()
		//	.append('rect')
		//	.call(force.drag)
		//	.on('mousedown', function() { d3.event.stopPropagation(); });

		var links = svg
			.selectAll('line')
			.data(linkData)
			.enter()
			.insert('line')
			.style('stroke', '#333')
			.style('stroke-width', '1px');

		var circleText = svg.selectAll('.frequency')
			.append('text')
			.attr('dx', 12)
			.attr('dy', '.25em')
			.text(function(d) { return d.percentage + '%'; });

		force.on('tick', function() {
			links
				.attr('x1', function(d) { return d.source.x; })
				.attr('y1', function(d) { return d.source.y; })
				.attr('x2', function(d) { return d.target.x; })
				.attr('y2', function(d) { return d.target.y; })

			circles
				.attr('cx', function(d) { return d.x; })
				.attr('cy', function(d) { return d.y; })
				.attr('r', function(d) { return d.radius; })
				.style('fill', function(d) { return d.color; });

			rects
				.attr('x', function(d) { return d.x; })
				.attr('y', function(d) { return d.y; })
				.attr('width', function(d) { return d.w; })
				.attr('height', function(d) { return d.h; })
				.style('fill', function(d) { return d.color; });

			circleText.attr('transform', function(d) { return 'translate(' + (d.x-30) + ', ' + d.y + ')'; })
		});
	};

	function main() {
		var graph = new Graph();
	}

	main();

})(document, d3);