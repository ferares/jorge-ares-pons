const babelify = require('babelify');
const browserify = require('browserify');
const browserSync = require('browser-sync').create();
const fs = require('fs-extra');
const path = require('path');
const phpServer = require('php-server');
const sass = require('node-sass');

const config = {
  host: '0.0.0.0',
  port: 2000,
};

// Paths
const dest = './dist';

function clean() {
  fs.rmSync(dest, { recursive: true, force: true });
}

function buildCss() {
  console.log('Building CSS');
  const css = sass.renderSync({
    file: './src/scss/main.scss',
    outFile: `${dest}/css/main.css`,
    precision: 8,
    outputStyle: 'compressed',
    sourceMap: true,
  });

  fs.outputFileSync(`${dest}/css/main.css`, css.css);
  fs.outputFileSync(`${dest}/css/main.css.map`, css.map);
}

function buildJs() {
  console.log('Building JS');
  const dir = path.dirname(`${dest}/js/bundle.js`);
  fs.mkdirSync(dir, { recursive: true });
  const output = browserify(
    ['./src/js/script.js'],
    { debug: true }
  )
  .transform(babelify.configure({ presets: ['@babel/preset-env'] }))
  .transform('unassertify', { global: true })
  .transform('@goto-bus-stop/envify', { global: true })
  .transform('uglifyify', { global: true })
  .plugin('common-shakeify')
  .plugin('browser-pack-flat/plugin')
  .bundle()
  .on('error', function (err) { console.log(`JS Error: ${err.message}`); })
  .pipe(fs.createWriteStream(`${dest}/js/bundle.js`));
}

function buildFiles() {
  console.log('Building files');
  const targets = [
    {
      src: './src/php/',
      dst: `${dest}/`,
    },
    {
      src: './src/files/',
      dst: `${dest}/`,
    },
  ];

  for (const target of targets) {
    fs.copySync(target.src, target.dst);
  }
}

function buildAssets() {
  console.log('Building assets');
}

function watch() {
  console.log('Watching for changes');
  fs.watch('./src/php/', () => { buildFiles(); browserSync.reload(); });
  fs.watch('./src/files/', () => { buildFiles(); browserSync.reload(); });
  fs.watch('./src/scss/', () => { buildCss(); browserSync.reload(); });
  // fs.watch('./src/js/', () => { buildJs(); browserSync.reload(); });
}

async function serve() {
  await phpServer({
    port: config.port,
    hostname: config.host,
    base: './dist',
  });
  browserSync.init({
    proxy: `${config.host}:${config.port}`,
    host: config.host,
    port: config.port + 1,
    ghostMode: {
      clicks: false,
      forms: false,
      scroll: false,
    },
  });
}

clean();
buildCss();
// buildJs();
buildFiles();
serve();
watch();
