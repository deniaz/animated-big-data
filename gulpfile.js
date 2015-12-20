var gulp = require('gulp'),
	jshint = require('gulp-jshint');
	concat = require('gulp-concat'),
	uglify = require('gulp-uglify');

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

gulp.task('watch', function() {
	gulp.watch('src/*.js', ['default']);
});