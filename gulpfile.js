var gulp = require('gulp'),
	jshint = require('gulp-jshint'),
	concat = require('gulp-concat'),
	uglify = require('gulp-uglify'),
	fs = require('fs'),
	readline = require('readline');

gulp.task('default', ['lint'], function() {
	var version = require('./package.json').version;
	return gulp.src([
		'vendor/*.js',
		'src/Controls.js',
		'src/LayoutEngine.js',
		'src/Visualization.js',
		'src/Hypergraph.js'
	])
	.pipe(uglify())
	.pipe(concat('abdv-' + version + '.min.js'))
	.pipe(gulp.dest('dist'))
});

gulp.task('lint', function() {
	return gulp.src([
		'src/Controls.js',
		'src/LayoutEngine.js',
		'src/Visualization.js',
		'src/Hypergraph.js'
	])
	.pipe(jshint())
	.pipe(jshint.reporter('default'));
});

gulp.task('convert', function() {
	fs.readdir('./data', function(err, files) {
		if (err) throw err;

		var graph = [];

		// Filters dot files and other stuff from files array
		var dataFiles = files.filter(function(file) {
			return (fs.lstatSync('./data/' + file).isFile() && file.charAt(0) !== '.')
		});

		dataFiles.forEach(function(file, i) {
			// Create line reader
			var reader = readline.createInterface({
				input: fs.createReadStream('./data/' + file)
			});

			console.log('Reading ' + file + ' (' + i + ')');

			reader.on('line', function(line) {
				var newItemset = readItemset(line, i);
				var existingItemset = find(graph, newItemset);

				if (!existingItemset) {
					// If itemset is not already in the graph and the it's not in the first interval file,
					// the interval-steps before this one need to be mocked (set to zero).
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

			if (i === dataFiles.length - 1) {
				reader.on('close', function() {
					write(graph);
				});
			}
		});
	});
});

gulp.task('watch', function() {
	gulp.watch('src/*.js', ['default']);
});

/**
 * Reads an itemset from an input line.
 * @param line string
 * @param step interval step
 * @returns {Array} Transformed itemset
 */
function readItemset(line, step) {
	var itemset = [],
		rawAttributes = line.split(' ');

	for (var i = 0; i < rawAttributes.length - 1; i++) {
		var attr = rawAttributes[i].split(',');
		var id = attr[0];
		var label = attr[1].replace(/\"/g, '');

		itemset.push({
			type: 'attribute',
			id: id,
			label: label
		});
	}

	var rawFrequency = rawAttributes[rawAttributes.length - 1].replace('(', '').replace(')', '');
	var splitted = rawFrequency.split(',');
	var percentage = parseFloat(splitted[0]).toFixed(2);
	var id = parseInt(splitted[1]);

	itemset.push({
		type: 'frequency',
		id: id,
		label: id,
		intervals: [
			{
				percentage: parseFloat(percentage),
				label: id
			}
		]
	});

	return itemset;
};

/**
 * Helper function to write graph-array to JSON file.
 * @param graph
 */
function write(graph) {
	fs.writeFile('data.json', JSON.stringify(graph), function(err) {
		if (err) return console.log(err);
		console.log('Data converted in data.json');
	});
};

/**
 * Helper Function to find an existing itemset in the graph.
 * @param graph array
 * @param newItemset array
 * @returns {array|false} Found itemset or false if not found.
 */
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