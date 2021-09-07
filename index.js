const babelify = require('babelify');
const browserify = require('browserify');
const browserSync = require('browser-sync').create();
const chokidar = require('chokidar');
const crypto = require('crypto');
const fs = require('fs-extra');
const modifyFilename = require('modify-filename');
const path = require('path');
const phpServer = require('php-server');
const sass = require('node-sass');

const config = {
  host: '0.0.0.0',
  port: 2000,
};

// Paths
const dest = './dist';

const paths = {
  src: {
    scss: {
      all: './src/scss/',
      files: ['./src/scss/main.scss'],
    },

    js: {
      all: './src/js/',
      files: ['./node_modules/bootstrap/dist/js/bootstrap.min.js'],
    },

    files: {
      all: './src/files/',
      files: ['./src/files/'],
    },

    php: {
      all: './src/php/',
      files: ['./src/php/'],
    },
  },

  dest: {
    scss: `${dest}/css`,
    js: `${dest}/js`,
    files: dest,
    php: dest,
  },
};

function clean() {
  fs.rmSync(dest, { recursive: true, force: true });
}

function rev(files, manifestPath) {
  const manifest = {};
  for (const file of files) {
    const hash = crypto.createHash('md5').update(file.content).digest('hex').slice(0, 10);
    const newPath = modifyFilename(file.path, (filename, ext) => `${filename}-${hash}${ext}`);
    fs.renameSync(file.path, newPath);
    manifest[path.basename(file.path)] = path.basename(newPath);
  }

  fs.writeFileSync(manifestPath, JSON.stringify(manifest));
}

function buildCSS() {
  console.log('Building CSS');
  const files = [];
  for (const file of paths.src.scss.files) {
    const filename = path.basename(file, '.scss');
    const outputFilePath = `${paths.dest.scss}/${filename}.css`;
    const css = sass.renderSync({
      file: file,
      outFile: outputFilePath,
      precision: 8,
      outputStyle: 'compressed',
      sourceMap: true,
    });

    fs.outputFileSync(outputFilePath, css.css);
    fs.outputFileSync(`${outputFilePath}.map`, css.map);
    files.push({ path: outputFilePath, content: css.css });
  }
  rev(files, `${dest}/manifest-css.json`);
}

function buildJS() {
  console.log('Building JS');
  fs.mkdirSync(paths.dest.js, { recursive: true });
  const outputFilePath = `${paths.dest.js}/main.js`;
  const output = browserify(paths.src.js.files, { debug: true })
  .transform(babelify.configure({ presets: ['@babel/preset-env'] }))
  .transform('unassertify', { global: true })
  .transform('@goto-bus-stop/envify', { global: true })
  .transform('uglifyify', { global: true, sourceMap: false })
  .plugin('common-shakeify')
  .plugin('browser-pack-flat/plugin')
  .bundle()
  .on('error', function (err) { console.log(`JS Error: ${err.message}`); })
  .pipe(fs.createWriteStream(outputFilePath));
  // rev([{ path: outputFilePath, content: fs.readFileSync(outputFilePath) }], `${dest}/manifest-js.json`);
}

function buildFiles() {
  console.log('Building files');
  for (const path of paths.src.files.files) {
    fs.copySync(path, paths.dest.files);
  }
}

function buildPHP() {
  console.log('Building PHP');
  for (const path of paths.src.php.files) {
    fs.copySync(path, paths.dest.php);
  }
}

function buildAssets() {
  console.log('Building assets');
}

function watch(path, action) {
  chokidar.watch(path).on('change', () => {
    action();
    browserSync.reload();
  });
}

function watchAll() {
  console.log('Watching for changes');
  watch(paths.src.php.all, buildPHP);
  watch(paths.src.files.all, buildFiles);
  watch(paths.src.scss.all, buildCSS);
  watch(paths.src.js.all, buildJS);
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
buildCSS();
buildJS();
buildPHP();
buildFiles();
buildAssets();
serve();
watchAll();
