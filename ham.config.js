module.exports = {
	directory: './assets',
	output: './public',
	exclude: ['robots.txt', 'sitemap.xml'],
	manifest: {
		path: 'manifest.json',
		fullPath: true,
		template: (files) => JSON.stringify(files),
	}
}