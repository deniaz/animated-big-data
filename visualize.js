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
				w: 175,
				h: 60,
				color: '#c0392b',
				name: 'Brodworscht'
			},
			{
				w: 125,
				h: 60,
				color: '#c0392b',
				name: 'Bürli'
			},
			{
				w: 200,
				h: 60,
				color: '#c0392b',
				name: 'Bier'
			}
		];

		var forceData = circleData.concat(rectData);

		var linkData = [
			{
				source: forceData[0],
				target: forceData[2]
			},
			{
				source: forceData[0],
				target: forceData[3]
			},
			{
				source: forceData[1],
				target: forceData[2]
			},
			{
				source: forceData[1],
				target: forceData[3]
			},
			{
				source: forceData[1],
				target: forceData[4]
			}
		];

		var groups = svg
			.selectAll('g')
			.data(forceData)
			.enter()
			.append('g')
			.attr('class', function(d) {
				if (!!d.name) {
					return 'attribute';
				} else {
					return 'frequency';
				}

			})
			.call(force.drag)
			.on('mousedown', function() { d3.event.stopPropagation(); });


		var circle = svg.selectAll('.frequency').append('circle');
		var rect = svg.selectAll('.attribute').append('rect');

		var frequency = svg.selectAll('.frequency').append('text').text(function(d) {
			return d.percentage + '%';
		});

		var attribute = svg.selectAll('.attribute').append('text').text(function(d) {
			return d.name;
		});

		force
			.nodes(forceData)
			.links(linkData)
			.charge(-100)
			.linkDistance(400);

		var link = svg
			.selectAll('line')
			.data(linkData)
			.enter()
			.insert('line')
			.style('stroke', '#333')
			.style('stroke-width', '1px');

		force.start();

		force.on('tick', function() {
			link
				.attr('x1', function(d) { return d.source.x; })
				.attr('y1', function(d) { return d.source.y; })
				.attr('x2', function(d) { return d.target.x; })
				.attr('y2', function(d) { return d.target.y; })

			circle
				.attr('cx', function(d) { return d.x; })
				.attr('cy', function(d) { return d.y; })
				.attr('r', function(d) { return d.radius; })
				.style('fill', function(d) { return d.color; });

			rect
				.attr('x', function(d) { return d.x; })
				.attr('y', function(d) { return d.y; })
				.attr('width', function(d) { return d.w; })
				.attr('height', function(d) { return d.h; })
				.style('fill', function(d) { return d.color; });

			svg.selectAll('.frequency text').attr('transform', function(d) {
				return 'translate(' + (d.x-20) + ', ' + d.y + ')';
			});

			svg.selectAll('.attribute text').attr('transform', function(d) {
				return 'translate(' + (d.x+30) + ', ' + (d.y+30) + ')';
			});

			//circleText.attr('transform', function(d) { return 'translate(' + (d.x-30) + ', ' + d.y + ')'; })
		});
	};

	function main() {
		var graph = new Graph();
	}

	main();

})(document, d3);