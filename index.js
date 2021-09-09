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

    assets: {
      all: './src/assets/',
      files: [],
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
    assets: `${dest}/assets`,
    files: dest,
    php: dest,
  },
};

function rev(files, manifestPath) {
  return new Promise((resolve, reject) => {
    fs.readJson(manifestPath, (err, manifest) => {
      if (err) manifest = {};
      const promises = [];
      for (const file of files) {
        const hash = crypto.createHash('md5').update(file.content).digest('hex').slice(0, 10);
        const newPath = modifyFilename(file.path, (filename, ext) => `${filename}-${hash}${ext}`);
        promises.push(fs.rename(file.path, newPath));
        manifest[path.basename(file.path)] = path.basename(newPath);
      }
      Promise.all(promises).then(() => {
        fs.outputJson(manifestPath, manifest).then(resolve).catch(reject);
      });
    });
  });
}

function clean() {
  console.log('Cleaning...');
  return new Promise((resolve, reject) => {
    fs.rm(dest, { recursive: true, force: true }).then(resolve).catch(reject).finally(console.log('Cleaning done.'));
  });
}

function buildCSS() {
  console.log('Building CSS...');
  return new Promise((resolve, reject) => {
    const promises = [];
    const files = [];
    for (const file of paths.src.scss.files) {
      const filename = path.basename(file, '.scss');
      const outputFilePath = `${paths.dest.scss}/${filename}.css`;
      promises.push(new Promise((resolve, reject) => {
        return sass.render({
          file: file,
          outFile: outputFilePath,
          precision: 8,
          outputStyle: 'compressed',
          sourceMap: true,
          sourceMapEmbed: true,
        }, (err, res) => {
          if (err) return reject(err);
          resolve(res);
        });
      }));
    }
    Promise.all(promises).then((values) => {
      const promises = [];
      for (var value of values) {
        const filename = path.basename(value.stats.entry, '.scss');
        const outputFilePath = `${paths.dest.scss}/${filename}.css`;
        promises.push(fs.outputFile(outputFilePath, value.css));
        files.push({ path: outputFilePath, content: value.css });
      }
      Promise.all(promises).then(() => {
        rev(files, `${dest}/manifest-css.json`);
        resolve();
      }).catch(reject).finally(console.log('Building CSS done.'));
    });
  });
}

function buildJS() {
  console.log('Building JS...');
  return new Promise((resolve, reject) => {
    fs.mkdir(paths.dest.js, { recursive: true }).then(() => {
      const outputFilePath = `${paths.dest.js}/main.js`;
      const output = browserify(paths.src.js.files, { debug: true })
      .on('bundle', () => {
        fs.readFile(outputFilePath).then((content) => {
          rev([{ path: outputFilePath, content: content }], `${dest}/manifest-js.json`);
        });
      })
      .transform(babelify.configure({ presets: ['@babel/preset-env'] }))
      .transform('unassertify', { global: true })
      .transform('@goto-bus-stop/envify', { global: true })
      .transform('uglifyify', { global: true, sourceMap: true })
      .plugin('common-shakeify')
      .plugin('browser-pack-flat/plugin')
      .bundle()
      .pipe(fs.createWriteStream(outputFilePath))
      .on('error', reject)
      .on('finish', () => {
        console.log('Building JS done.');
        resolve();
      });
    });
  });
}

function buildFiles() {
  console.log('Building files...');
  return new Promise((resolve, reject) => {
    const promises = [];
    for (const path of paths.src.files.files) {
      promises.push(fs.copy(path, paths.dest.files));
    }
    Promise.all(promises).then(resolve).catch(reject).finally(console.log('Building files done.'));
  });
}

function buildPHP(done) {
  console.log('Building PHP...');
  return new Promise((resolve, reject) => {
    const promises = [];
    for (const path of paths.src.php.files) {
      promises.push(fs.copy(path, paths.dest.php));
    }
    Promise.all(promises).then(resolve).catch(reject).finally(console.log('Building PHP done.'));
  });
}

function buildAssets() {
  console.log('Building assets...');
  return new Promise((resolve, reject) => {
    fs.mkdir(paths.dest.assets, { recursive: true }).then(() => {
      const promises = [];
      const files = [];
      for (const file of paths.src.assets.files) {
        const filename = path.basename(file);
        promises.push(fs.copyFile(file, `${paths.dest.assets}/${filename}`));
      }
      Promise.all(promises).then((values) => {
        const promises = [];
        for (const file of paths.src.assets.files) {
          promises.push(fs.readFile(file).then((content) => {
            const filePath = `${paths.dest.assets}/${path.basename(file)}`;
            return { path: filePath, content: content };
          }));
        }
        Promise.all(promises).then((files) => {
          rev(files, `${dest}/manifest-assets.json`).then(resolve);
        });
      }).catch(reject).finally(console.log('Building assets done.'));
    });
  });
}

function watch(path, action) {
  chokidar.watch(path).on('change', () => {
    action();
    browserSync.reload();
  });
}

function watchAll() {
  console.log('Watching for changes...');
  watch(paths.src.php.all, buildPHP);
  watch(paths.src.files.all, buildFiles);
  watch(paths.src.scss.all, buildCSS);
  watch(paths.src.js.all, buildJS);
}

function serve() {
  console.log('Starting local dev server...');
  return new Promise((resolve, reject) => {
    phpServer({
      port: config.port,
      hostname: config.host,
      base: './dist',
    }).then(() => {
      browserSync.init({
        proxy: `${config.host}:${config.port}`,
        host: config.host,
        port: config.port + 1,
        ghostMode: {
          clicks: false,
          forms: false,
          scroll: false,
        },
      }, () => {
        console.log('Starting local dev server done.');
        resolve();
      });
    });
  });
}

clean().then(() => {
  buildAssets().then(() => {
    const promises = [
      buildCSS(),
      buildJS(),
      buildPHP(),
      buildFiles(),
    ];
    Promise.all(promises).then(() => {
      serve().then(() => {
        watchAll();
      });
    });
  });
});
