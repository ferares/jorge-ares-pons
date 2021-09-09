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

const params = process.argv.slice(2);

const config = {
  host: '0.0.0.0',
  port: 2000,
  prod: params.indexOf('--prod') > -1,
  serve: params.indexOf('--serve') > -1,
};

console.log(`Building project for ${config.prod ? 'PRODUCTION' : 'DEVELOPMENT'}`);

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
  console.time('Cleaning done after');
  console.log('Cleaning...');
  return new Promise((resolve, reject) => {
    fs.rm(dest, { recursive: true, force: true }).then(resolve).catch(reject).finally(console.timeEnd('Cleaning done after'));
  });
}

function buildCSS() {
  console.time('Building CSS done after');
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
          outputStyle: config.prod ? 'compressed' : 'expanded',
          sourceMap: !config.prod,
          sourceMapEmbed: !config.prod,
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
        if (config.prod) {
          files.push({ path: outputFilePath, content: value.css });
        }
      }
      Promise.all(promises).then(() => {
        if (config.prod) {
          rev(files, `${dest}/manifest-css.json`);
        }
        resolve();
      }).catch(reject).finally(console.timeEnd('Building CSS done after'));
    });
  });
}

function buildJS() {
  console.time('Building JS done after');
  console.log('Building JS...');
  return new Promise((resolve, reject) => {
    fs.mkdir(paths.dest.js, { recursive: true }).then(() => {
      const outputFilePath = `${paths.dest.js}/main.js`;
      const browserifyInstance = browserify(paths.src.js.files, { debug: true })
      .on('bundle', () => {
        if (config.prod) {
          fs.readFile(outputFilePath).then((content) => {
            rev([{ path: outputFilePath, content: content }], `${dest}/manifest-js.json`);
          });
        }
      }).transform(babelify.configure({ presets: ['@babel/preset-env'] }));

      if (config.prod) {
        browserifyInstance.transform('unassertify', { global: true })
        .transform('@goto-bus-stop/envify', { global: true })
        .transform('uglifyify', { global: true, sourceMap: true })
        .plugin('common-shakeify')
        .plugin('browser-pack-flat/plugin');
      }

      browserifyInstance.bundle()
      .pipe(fs.createWriteStream(outputFilePath))
      .on('error', reject)
      .on('finish', () => {
        console.timeEnd('Building JS done after');
        resolve();
      });
    });
  });
}

function buildFiles() {
  console.time('Building files done after');
  console.log('Building files...');
  return new Promise((resolve, reject) => {
    const promises = [];
    for (const path of paths.src.files.files) {
      promises.push(fs.copy(path, paths.dest.files));
    }
    Promise.all(promises).then(resolve).catch(reject).finally(console.timeEnd('Building files done after'));
  });
}

function buildPHP(done) {
  console.time('Building PHP done after');
  console.log('Building PHP...');
  return new Promise((resolve, reject) => {
    const promises = [];
    for (const path of paths.src.php.files) {
      promises.push(fs.copy(path, paths.dest.php));
    }
    Promise.all(promises).then(resolve).catch(reject).finally(console.timeEnd('Building PHP done after'));
  });
}

function buildAssets() {
  console.time('Building assets done after');
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
        if (config.prod) {
          const promises = [];
          for (const file of paths.src.assets.files) {
            promises.push(fs.readFile(file).then((content) => {
              const filePath = `${paths.dest.assets}/${path.basename(file)}`;
              return { path: filePath, content: content };
            }));
          }
          Promise.all(promises).then((files) => {
            rev(files, `${dest}/manifest-assets.json`).then(resolve).finally(console.timeEnd('Building assets done after'));
          });
        } else {
          console.timeEnd('Building assets done after');
          resolve();
        }
      }).catch(reject);
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
  console.time('Starting local dev server done after');
  console.log('Starting local dev server...');
  return new Promise((resolve, reject) => {
    phpServer({
      port: config.port,
      hostname: config.host,
      base: dest,
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
        console.timeEnd('Starting local dev server done after');
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
    if (config.serve) {
      Promise.all(promises).then(() => {
        serve().then(() => {
          watchAll();
        });
      });
    }
  });
});
