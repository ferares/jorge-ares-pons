const babelify = require('babelify');
const browserify = require('browserify');
const browserSync = require('browser-sync').create();
const chokidar = require('chokidar');
const crypto = require('crypto');
const fs = require('fs-extra');
const modifyFilename = require('modify-filename');
const path = require('path');
const phpServer = require('php-server');
const sass = require('sass');
const through = require('through2');

const params = process.argv.slice(2);

const config = {
  dest: './dist',
  host: '0.0.0.0',
  port: 2000,
  prod: params.indexOf('--prod') > -1,
  serve: params.indexOf('--serve') > -1,
};

const paths = {
  styles: { bundles: [] },

  scripts: {
    watch: './src/scripts/',
    bundles: [
      {
        name: 'main.js',
        files: ['./node_modules/bootstrap/dist/js/bootstrap.min.js'],
      },
    ],
    dest: `${config.dest}/scripts`,
  },

  assets: {
    watch: './src/assets/',
    files: ['./src/assets/'],
    dest: `${config.dest}/assets`,
  },

  files: {
    watch: ['./src/files/', './src/views/'],
    files: ['./src/files/', './src/views/'],
    dest: config.dest,
  },
};

const revQueues = {};

/**
 * Queues an entry to be added to a revision manifest
 * @param {string} path path to the manifest file
 * @param {object} entry object with the key and value of the entry to be added
 * @param {function} cb callback function to be called after the entry is added
 */
function revQueueAdd(path, entry, cb) {
  // If there's no queue for the manifest create one
  if (revQueues[path] === undefined) {
    revQueues[path] = [];
  }

  // Add the entry to the manifest's queue
  revQueues[path].push({ entry: entry, cb: cb });

  // If there's only one item on the queue add it to the manifest
  if (revQueues[path].length === 1) {
    revQueueNext(path);
  }
}

/**
 * Adds the next entry on a manifest's queue to that manifest
 * @param {string} path path to the manifest file
 */
function revQueueNext(path) {
  // If there are no items on the queue return
  if (revQueues[path].length === 0) return;

  // Get the next element on the queue
  const element = revQueues[path][0];

  // Read the manifest file
  fs.readJson(path, (err, manifest) => {
    // If there's no manifest initalize it
    if (err) manifest = {};

    // Add the entry to the manifest
    manifest[element.entry.key] = element.entry.value;

    // Write the updated manifest file
    fs.outputJson(path, manifest).then(() => {
      // Remove the porcessed entry from the queue
      revQueues[path].shift();
      // Call the entry's callback function
      element.cb();
      // Add the next item on the queue
      revQueueNext(path);
    });
  });
}

/**
 * Replace any occurrence of a manifest's entries on a given string
 * @param {string} content the content to parse for occurrences
 * @param {object} manifest the manifest
 *
 * @return {string} the modified content
 */
function revReplace(content, manifest) {
  // For every key on the manifest
  for (var key in manifest) {
    // If the key is found on the given content
    if ((manifest.hasOwnProperty(key)) && (content.indexOf(key) > -1)) {
      // Replace all the key's occurences with the value associated to it on the manifest
      content = content.replace(new RegExp(key, 'g'), manifest[key]);
    }
  }

  // Return the modified content
  return content;
}

/**
 * Browserify transform for replacing any occurrence of a manifest's entry on a given string
 * @param {any} file the file being processed by browserify
 * @param {object} config browserify config including a manifest property with the path to the manifest
 */
function revReplaceify(file, config) {
  return through(function (buf, enc, next) {
    // Read the manifest file
    fs.readJson(config.manifest).then((manifest) => {
      // Replace any occurrence of the manifest's entries
      this.push(revReplace(buf.toString('utf8'), manifest));
      next();
    });
  });
}

/**
 * Renames a file to include it's MD5 hash on its filename
 * @param {array} files the files to be renamed
 * @param {string} manifestPath the path to the manifest on which to reference the old and new names
 */
function rev(files, manifestPath) {
  return new Promise((resolve, reject) => {
    const promises = [];
    // For each file
    for (const file of files) {
      // Calculate it's MD5 hash
      const hash = crypto.createHash('md5').update(file.content).digest('hex').slice(0, 10);
      // Change it's name to include the hash
      const newPath = modifyFilename(file.path, (filename, ext) => `${filename}-${hash}${ext}`);
      // Rename the file
      fs.rename(file.path, newPath);
      promises.push(new Promise((resolve, reject) => {
        // Add an entry to the manifest linking it's old name to the new one
        revQueueAdd(manifestPath, { key: path.relative(file.base, file.path), value: path.relative(file.base, newPath) }, resolve);
      }));
    }
    Promise.all(promises).then(resolve).catch(reject);
  });
}

/**
 * Deletes the output "dest" directory with all it's contents
 */
function clean() {
  console.time('Cleaning done after');
  console.log('Cleaning...');
  return new Promise((resolve, reject) => {
    fs.rm(config.dest, { recursive: true, force: true }).then(() => {
      console.timeEnd('Cleaning done after');
      resolve();
    }).catch(reject);
  });
}

/**
 * Process al the SCSS files from paths.styles.bundles and outputs CSS files on paths.styles.dest
 */
function buildStyles() {
  console.time('Building styles done after');
  console.log('Building styles...');
  return new Promise((resolve, reject) => {
    const promises = [];
    // For each entry file
    for (const bundle of paths.styles.bundles) {
      // Destination CSS file
      const outputFilePath = `${paths.styles.dest}/${bundle.name}`;
      promises.push(new Promise((resolve, reject) => {
        // Render the SASS files
        return sass.render({
          file: bundle.entry,
          outFile: outputFilePath,
          outputStyle: config.prod ? 'compressed' : 'expanded',
          sourceMap: !config.prod,
          sourceMapEmbed: !config.prod,
        }, (err, res) => {
          if (err) return reject(err);
          resolve({ name: bundle.name, output: res });
        });
      }));
    }

    // After the files are rendered
    Promise.all(promises).then((values) => {
      let manifest = '';
      if (config.prod) {
        // If we're building for pord get the assets manifest
        manifest = fs.readJsonSync(`${config.dest}/manifest-assets.json`);
      }
      const promises = [];
      const files = [];
      // For each file
      for (var value of values) {
        let content = value.output.css;
        if (config.prod) {
          // If we're building for pord update any reference to any asset with its "hased" filename
          content = revReplace(content.toString('utf8'), manifest);
        }
        // Write the rendered CSS to a file
        const outputFilePath = `${paths.styles.dest}/${value.name}`;
        promises.push(fs.outputFile(outputFilePath, content));
        if (config.prod) {
          // If we're building for pord add the file to the array of files to be "hashed"
          files.push({ path: outputFilePath, base: paths.styles.dest, content: content });
        }
      }

      // After all the files have been writen
      Promise.all(promises).then(() => {
        if (config.prod) {
          // If we're building for pord "hash" the files
          rev(files, `${config.dest}/manifest-styles.json`).then(() => {
            console.timeEnd('Building styles done after');
            resolve();
          });
        } else {
          // If we're not building for pord we're done
          console.timeEnd('Building styles done after');
          resolve();
        }
      }).catch(reject);
    });
  });
}

/**
 * Process al the JS files from paths.scripts.bundles and outputs browser ready JS files on paths.scripts.dest
 */
function buildScripts() {
  console.time('Building scripts done after');
  console.log('Building scripts...');
  return new Promise((resolve, reject) => {
    // Create the destination directory for the scripts
    fs.mkdir(paths.scripts.dest, { recursive: true }).then(() => {
      const promises = [];
      // For each designated bundle
      for (const bundle of paths.scripts.bundles) {
        const outputFilePath = `${paths.scripts.dest}/${bundle.name}`;
        promises.push(new Promise((resolve, reject) => {
          // Use browserify to transpile and optimize the JS
          const browserifyInstance = browserify(bundle.files, { debug: !config.prod })
          .transform(babelify.configure({ presets: ['@babel/preset-env'] }));

          // Production only optimizations
          if (config.prod) {
            browserifyInstance
            .transform(revReplaceify, { manifest: `${config.dest}/manifest-assets.json` })
            .transform('unassertify', { global: true })
            .transform('@goto-bus-stop/envify', { global: true })
            .transform('uglifyify', { global: true, sourceMap: false })
            .plugin('common-shakeify')
            // https://github.com/goto-bus-stop/browser-pack-flat/issues/39
            // .plugin('browser-pack-flat/plugin')
            .on('bundle', () => {
              // After the bundle has been processed "hash" it
              fs.readFile(outputFilePath).then((content) => {
                rev([{ path: outputFilePath, base: paths.scripts.dest, content: content }], `${config.dest}/manifest-scripts.json`);
              });
            });
          }

          const browserifyBundle = browserifyInstance.bundle();

          if (config.prod) {
            // Production only optimization for the bundle
            browserifyBundle.pipe(require('minify-stream')({ sourceMap: false }))
          }

          browserifyBundle.pipe(fs.createWriteStream(outputFilePath))
          .on('finish', resolve)
          .on('error', reject);
        }));
      }

      Promise.all(promises).then(() => {
        // After all bundles have been processed we're done
        console.timeEnd('Building scripts done after');
        resolve();
      }).catch(reject);
    });
  });
}

/**
 * Copies all files from paths.files.files to paths.files.dest
 */
function buildFiles() {
  console.time('Building files done after');
  console.log('Building files...');
  return new Promise((resolve, reject) => {
    const promises = [];
    for (const path of paths.files.files) {
      promises.push(fs.copy(path, paths.files.dest));
    }
    Promise.all(promises).then(() => {
      console.timeEnd('Building files done after');
      resolve();
    }).catch(reject);
  });
}

/**
 * Copies an asset file to paths.assets.dest
 * @param {string} asset the path to the asset file
 * @param {string} base the base path of the file
 */
function buildAssetFile(asset, base) {
  return new Promise((resolve, reject) => {
    // The destination path should include the subfolders after the base
    const filename = `${paths.assets.dest}/${path.relative(base, asset)}`;
    // Create the destination directory if it doesn't exist
    fs.mkdir(path.dirname(filename), { recursive: true }).then(() => {
      // Copy the file over
      fs.copyFile(asset, filename).then(() => {
        if (config.prod) {
          // If we're building for prod we need to "hash" the filename
          fs.readFile(asset).then((content) => {
            const file = { path: filename, base: paths.assets.dest, content: content };
            rev([file], `${config.dest}/manifest-assets.json`).then(resolve);
          });
        } else {
          resolve();
        }
      });
    });
  });
}

/**
 * Copies an asset folder to paths.assets.dest
 * @param {string} folder the path to the asset folder
 * @param {string} base the base path of the folder
 */
function buildAssetFolder(folder, base) {
  return new Promise((resolve, reject) => {
    // Read the directory
    fs.readdir(folder).then((elements) => {
      const promises = [];
      // For each element
      for (const element of elements) {
        promises.push(new Promise((resolve, reject) => {
          const asset = `${folder}/${element}`;
          // Check to see if it's a file or a directory
          fs.lstat(asset).then((stats) => {
            if (stats.isFile()) {
              // If it's a file process it
              buildAssetFile(asset, base).then(resolve).catch(reject);
            } else {
              // If it's a folder recursively process it
              buildAssetFolder(asset, base).then(resolve).catch(reject);
            }
          });
        }));
      }
      Promise.all(promises).then(resolve).catch(reject);
    });
  });
}

/**
 * Copies all assets from paths.assets.files to paths.assets.dest
 */
function buildAssets() {
  console.time('Building assets done after');
  console.log('Building assets...');
  return new Promise((resolve, reject) => {
    fs.mkdir(paths.assets.dest, { recursive: true }).then(() => {
      const promises = [];
      const elements = paths.assets.files;
      // For each asset element
      for (const element of elements) {
        promises.push(new Promise((resolve, reject) => {
          // Check to see if it's a file or a directory
          fs.lstat(element).then((stats) => {
            const base = path.normalize(element);
            if (stats.isFile()) {
              // If it's a file process it
              buildAssetFile(element, base).then(resolve).catch(reject);
            } else {
              // If it's a folder recursively process it
              buildAssetFolder(element, base).then(resolve).catch(reject);
            }
          });
        }));
      }
      Promise.all(promises).then(() => {
        console.timeEnd('Building assets done after');
        resolve();
      }).catch(reject);
    });
  });
}

/**
 * Watches a file or directory for changes and calls an action when changes are made
 * @param {string} path the path to the element to watch
 * @param {function} action the function to call when changes occur
 */
function watch(path, action) {
  chokidar.watch(path).on('change', () => {
    action(); // Call the action
    browserSync.reload(); // Reload the browser
  });
}

/**
 * Watches for changes on paths.files.watch, paths.styles.watch, paths.scripts.watch and paths.assets.watch
 */
function watchAll() {
  console.log('Watching for changes...');
  watch(paths.files.watch, buildFiles);
  watch(paths.styles.watch, buildStyles);
  watch(paths.scripts.watch, buildScripts);
  watch(paths.assets.watch, () => {
    buildAssets().then(() => {
      // If we're building for prod we need to rebuild the scripts and styles too
      // in case there are references to assets files in them
      if (config.prod) {
        buildStyles();
        buildScripts();
      }
    });
  });
}

/**
 * Starts a PHP dev server and a browserSync proxy server for live reloading
 */
function serve() {
  console.time('Starting local dev server done after');
  console.log('Starting local dev server...');
  return new Promise((resolve, reject) => {
    phpServer({
      port: config.port,
      hostname: config.host,
      base: config.dest,
    }).then((server) => {
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
        // Log the PHP server's messages
        server.stderr.on('data', (data) => process.stdout.write(data));
        resolve();
      });
    });
  });
}

// Build the project
console.log(`Building project for ${config.prod ? 'PRODUCTION' : 'DEVELOPMENT'}`);
clean().then(() => {
  buildAssets().then(() => {
    const promises = [
      buildFiles(),
      buildStyles(),
      buildScripts(),
    ];
    if (config.serve) {
      // If the serve option was passed serve and watch the project
      Promise.all(promises).then(() => {
        serve().then(() => {
          watchAll();
        });
      });
    }
  });
});
