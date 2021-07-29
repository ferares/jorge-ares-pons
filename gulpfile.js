/* global require, process */

const argv        = require('minimist')(process.argv.slice(2));
const browserSync = require('browser-sync').create();
const cleanCss    = require('gulp-clean-css');
const connect     = require('gulp-connect-php');
const del         = require('del');
const flatten     = require('gulp-flatten');
const gulp        = require('gulp');
const log         = require('fancy-log');
const noop        = require('gulp-noop');
const reload      = browserSync.reload();
const rev         = require('gulp-rev');
const sass        = require('gulp-sass');
const sourcemaps  = require('gulp-sourcemaps');
const uglify      = require('gulp-uglify');
const uglifyCss   = require('gulp-uglifycss');

const config = {
  host: 'localhost',
  port: 2000,
};

// Paths
const dest = './dist';

const paths = {
  src: {
    scss: {
      all: './src/scss/*.scss',
      files: ['./src/scss/main.scss'],
    },

    js: {
      all: ['./node_modules/bootstrap/dist/js/bootstrap.min.js'],
    },

    files: {
      all: ['./src/files/*', './src/files/.*'],
    },

    views: {
      all: ['./src/php/*.php', './src/php/**/*.php'],
    },
  },

  dest: {
    scss: `${dest}/css`,
    js: `${dest}/js`,
    files: dest,
    views: dest,
  },
};

gulp.task('clean', (done) => {
  del.sync(dest);
  done();
});

gulp.task('serve', () =>
  connect.server({
    host: config.host,
    port: config.port,
    base: dest,
  })
);

gulp.task('sync', () =>
  browserSync.init({
    proxy: config.host + ':' + config.port,
    host: config.host,
    port: config.port + 1,
    ghostMode: {
      clicks: false,
      forms: false,
      scroll: false,
    },
  })
);

gulp.task('watch', () => {
  gulp.watch(paths.src.scss.all, gulp.parallel(['build-scss']));
  gulp.watch(paths.src.js.all, gulp.parallel(['build-js']));
  gulp.watch(paths.src.views.all, gulp.parallel(['build-views']), reload);
});

gulp.task('build-scss', (done) => {
  gulp.src(paths.src.scss.files)
    .pipe(argv.prod ? noop() : sourcemaps.init())
    .pipe(sass({ precision: 8 })) // precision: 8 for bootstrap
    .pipe(argv.prod ? noop() : sourcemaps.write())
    .pipe(argv.prod ? cleanCss() : noop())
    .pipe(argv.prod ? uglifyCss() : noop())
    .pipe(argv.prod ? rev() : noop())
    .pipe(gulp.dest(paths.dest.scss))
    .pipe(argv.prod ? rev.manifest({
      path: 'manifest-css.json',
      merge: true,
    }) : noop())
    .pipe(argv.prod ? gulp.dest(dest) : noop())
    .pipe(argv.prod ? noop() : browserSync.stream());
  done();
});

gulp.task('build-js', () =>
  gulp.src(paths.src.js.all)
    .pipe(flatten())
    .pipe(argv.prod ? uglify() : noop())
    .on('error', function (err) { log('[Error]', err.toString()); })
    .pipe(argv.prod ? rev() : noop())
    .pipe(gulp.dest(paths.dest.js))
    .pipe(argv.prod ? rev.manifest({
      path: 'manifest-js.json',
      merge: true,
    }) : noop())
    .pipe(argv.prod ? gulp.dest(dest) : noop())
    .pipe(argv.prod ? noop() : browserSync.stream())
);

gulp.task('build-files', () =>
  gulp.src(paths.src.files.all)
    .pipe(gulp.dest(paths.dest.files))
);

gulp.task('build-views', () =>
  gulp.src(paths.src.views.all)
    .pipe(gulp.dest(paths.dest.views))
);

// Tasks
const devTasks = gulp.parallel(['serve', 'sync', 'watch']);

const buildTasks = gulp.series([
  'clean',
  gulp.parallel([
    'build-scss',
    'build-js',
    'build-views',
    'build-files',
  ]),
]);

gulp.task('default', gulp.series(buildTasks, devTasks));

gulp.task('build', buildTasks);
