var gulp = require('gulp'),
	jshint = require('gulp-jshint');
	concat = require('gulp-concat'),
	uglify = require('gulp-uglify');

gulp.task('default', ['lint'], function() {
	return gulp.src([
		'vendor/snap.svg-0.4.1.min.js',
		'src/Controls.js',
		'src/LayoutEngine.js',
		'src/Visualization.js',
		'src/Hypergraph.js'
	])
	.pipe(uglify())
	.pipe(concat('abdv.min.js'))
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
})