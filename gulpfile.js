const gulp = require('gulp');
const gutil = require('gulp-util');
const sourcemaps = require('gulp-sourcemaps');
const browserSync = require('browser-sync');
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const uglify = require('gulp-uglify');
const concat = require('gulp-concat');
const argv = require('yargs').argv;
const gulpif = require('gulp-if');

const isBuild = argv.build !== undefined;
const packagePath = './';
const target = isBuild ? 'build/' : 'demo/';
//const target = 'demo/';

const dirs = {
  dev: {
    root: `${packagePath}dev-src/`,
    img: `${packagePath}dev-src/img/`,
    js: `${packagePath}dev-src/js/`,
    scss: `${packagePath}dev-src/scss/`,
  },
  target: {
    root: packagePath + target,
    css: `${packagePath + target}css/`,
    js: `${packagePath + target}js/`,
    img: `${packagePath + target}img/`,
  },
};


// HTML
//-------------------------------------------------------------------
//
gulp.task('html', () => gulp.src(`${dirs.dev.root}/**/*.html`)
  .pipe(gulp.dest(dirs.target.root))
  .pipe(browserSync.reload({
    stream: true,
  })));

// IMG
//-------------------------------------------------------------------
//
gulp.task('img', () => gulp.src(`${dirs.dev.img}/**/*`)
  .pipe(gulp.dest(dirs.target.img))
  .pipe(browserSync.reload({
    stream: true,
  })));


// Javascript Tasks
//-------------------------------------------------------------------

gulp.task('js', () => gulp.src([
  `${dirs.dev.js}vendor/convnet-util.js`,
  `${dirs.dev.js}vendor/convnet-min.js`,
  `${dirs.dev.js}vendor/jquery-1.8.3.min.js`,
  `${dirs.dev.js}vendor/modernizr-2.0.6.js`,
  `${dirs.dev.js}vendor/parallel-limit.js`,
  `${dirs.dev.js}libs/config.js`,
  `${dirs.dev.js}libs/api.js`,
  `${dirs.dev.js}libs/helper.js`,
  `${dirs.dev.js}snk/app.js`,
  `${dirs.dev.js}app/app.js`,
]).pipe(concat('scripts.js'))
  .pipe(gulpif(isBuild, uglify()))
  .pipe(gulp.dest(dirs.target.js))
  .pipe(browserSync.reload({
    stream: true,
  })));

gulp.task('worker', () => gulp.src([
  `${dirs.dev.js}vendor/convnet-min.js`,
  `${dirs.dev.js}libs/config.js`,
  `${dirs.dev.js}libs/helper.js`,
  `${dirs.dev.js}libs/trainer.js`,
  `${dirs.dev.js}app/worker.js`,
]).pipe(concat('worker.js'))
  .pipe(gulpif(isBuild, uglify()))
  .pipe(gulp.dest(dirs.target.js))
  .pipe(browserSync.reload({
    stream: true,
  })));


// Styles Tasks
//-------------------------------------------------------------------

gulp.task('styles', () => {
  gulp.src(`${dirs.dev.scss}style.scss`)
    .pipe(sourcemaps.init())
    .pipe(sass())
    .on('error', gutil.log.bind(gutil, gutil.colors.red('\n\n*********************************** \n' +
      'SASS ERROR:' +
      '\n*********************************** \n\n')))
    .pipe(autoprefixer({
      browsers: ['last 15 versions'],
      cascade: false,
    }))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(dirs.target.css))
    .pipe(browserSync.reload({
      stream: true,
    }));
});

// Watch Tasks
//-------------------------------------------------------------------
gulp.task('watch', () => {
  gulp.watch(`${dirs.dev.root}**/*.html`, ['html']);
  gulp.watch(`${dirs.dev.scss}**/*.scss`, ['styles']);
  gulp.watch(`${dirs.dev.img}**/*`, ['img']);
  gulp.watch(`${dirs.dev.js}**/*.js`, ['js', 'worker']);
});


// Browser-Sync Tasks
//-------------------------------------------------------------------
gulp.task('browserSync', () => {
  browserSync({
    server: {
      baseDir: './demo/',
    },
    https: false,
    open: false,
  });
});

gulp.task('default', ['styles', 'img', 'js', 'worker', 'html', 'browserSync', 'watch']);
gulp.task('build', ['styles', 'img', 'js', 'worker', 'html']);
