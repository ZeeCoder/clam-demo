'use strict';

var env = 'dev';
var src  = './front_src';
var dest = './web';

var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var bower = require('main-bower-files');

gulp.task('bower', function() {
    return gulp.src(bower(), {base: src + '/bower_components'})
        .pipe(gulp.dest(dest + '/bower'));
});

gulp.task('scripts', function() {
    return browserify({
            entries: src + '/scripts/app.js',
            debug: env == 'dev',
        })
        .bundle()
        .on('error', handleErrors)
        .pipe(source('app.js'))
        .pipe(buffer())
        .pipe(env == 'prod' ? $.uglify() : $.util.noop())
        .pipe(gulp.dest(dest + '/js'));
});

gulp.task('styles', function () {
    return gulp.src(src + '/styles/*.scss')
        // .pipe(env == 'dev' ? $.sourcemaps.init() : $.util.noop())
        .pipe($.sass())
        .on('error', handleErrors)
        // .pipe(env == 'dev' ? $.sourcemaps.write() : $.util.noop())
        .pipe($.autoprefixer({browsers: ['last 2 version']}))
        .pipe(env == 'prod' ? $.csso() : $.util.noop())
        .pipe(gulp.dest(dest + '/css'));
});

gulp.task('images', function () {
    return gulp.src(src + '/images/**/*')
        .pipe($.cache($.imagemin({
            progressive: true,
            interlaced: true
        })))
        .pipe(gulp.dest(dest + '/image'));
});

gulp.task('watch', function() {
    gulp.watch(src + '/styles/**/*.scss', ['styles']);
    gulp.watch([
            src + '/scripts/**/*.js',
            src + '/bower_components/clam/**/*.js'
        ], ['scripts']
    );
});

gulp.task('env-to-prod', function() {
    env = 'prod';
});

gulp.task('build', ['env-to-prod', 'bower', 'scripts', 'styles', 'images']);
gulp.task('default', ['build']);

function handleErrors() {
    var args = Array.prototype.slice.call(arguments);

    // Send error to notification center with gulp-notify
    $.notify.onError({
        title: "Compile Error",
        message: "<%= error.message %>"
    }).apply(this, args);

    // Keep gulp from hanging on this task
    this.emit('end');
};
