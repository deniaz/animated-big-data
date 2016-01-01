#!/usr/bin/env node
var fs = require('fs'),
	readline = require('readline');

fs.readdir('./data', function(err, files) {
	if (err) throw err;

	var graph = [];

	files.forEach(function(file, i) {
		var reader = readline.createInterface({
			input: fs.createReadStream('./data/' + file)
		});

		reader.on('line', function(line) {
			var newItemset = readItemset(line, i);
			var existingItemset = find(graph, newItemset);

			if (!existingItemset) {
				if (i > 0) {
					console.log('New itemset found (which is not in the first interval).');
					var frequency = newItemset[newItemset.length-1];
					var interval = frequency.intervals[0];
					frequency.intervals = [];
					for (var j = 0; j < i; j++) {

						frequency.intervals.push({
							percentage: 0,
							label: null
						})
					}
					frequency.intervals.push(interval);
				}

				graph.push(newItemset);
			} else {
				var newFrequency = newItemset[newItemset.length - 1];
				var existingFrequency = existingItemset[existingItemset.length - 1];

				existingFrequency.intervals.push(newFrequency.intervals[0]);
			}
		});

		if (i === files.length - 1) {
			reader.on('close', function() {
				write(graph);
			});
		}
	});
});

function readItemset(line, step) {
	var itemset = [],
		rawAttributes = line.split(' ');

	for (var i = 0; i < rawAttributes.length - 1; i++) {
		var attr = rawAttributes[i];
		itemset.push({
			type: 'attribute',
			id: attr.split(',')[0],
			label: attr.split(',')[1].replace(/\"/g, '')
		});
	}

	var rawFrequency = rawAttributes[rawAttributes.length - 1].replace('(', '').replace(')', '');
	var splitted = rawFrequency.split(',');
	var percentage = parseFloat(splitted[0]).toFixed(2);
	itemset.push({
		type: 'frequency',
		id: splitted[1],
		intervals: [
			{
				percentage: parseFloat(percentage),
				label: rawFrequency.split(',')[1]
			}
		]
	});

	return itemset;
};

function write(graph) {
	fs.writeFile('data.json', JSON.stringify(graph), function(err) {
		if (err) return console.log(err);
		console.log('Data converted in data.json');
	});
};

function find(graph, newItemset) {
	// If graph is empty, it doesn't contain the new itemset
	if (graph.length === 0) {
		return false;
	}
	// Create a flat array of ID from new itemset
	var idList = newItemset.filter(function(el) {
		return el.type === 'attribute';
	}).map(function(el) {
		return el.id;
	});

	// loop over all itemsets
	graphloop:
	for (var i = 0; i < graph.length; i++) {
		var itemset = graph[i];
		// filter items (no frequency)
		var items = itemset.filter(function(item) { return item.type === 'attribute'; });

		// If the length is not the same, it's no match.
		if (items.length !== idList.length) {
			continue graphloop;
		}

		// loop over all items
		for (var j = 0; j < items.length; j++) {
			var item = items[j];
			if (idList.indexOf(item.id) === -1) {
				continue graphloop;
			}

			return itemset;
		}
	}

	return false;
};