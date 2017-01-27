const path = require('path');
const Express = require('express');
const webpack = require('webpack');
const devMiddleware = require('webpack-dev-middleware');
const hotMiddleware = require('webpack-hot-middleware');

const env = process.env.NODE_ENV;

const app = new Express();

let ssr;

if (env === 'local') {
	require('babel-register')({
		ignore: [/node_modules/]
	});
	ssr = require('../src/ssr.jsx').default;

	const config = require('../webpack/client.config');
	const compiler = webpack(config);

	// мидлвара, которая вотчит и пересобирает бандлы
	app.use(devMiddleware(compiler, {
		publicPath: config.output.publicPath,
		historyApiFallback: true,
		stats: {
			colors: true
		}
	}));

	// мидлвара, которая вотчит пересобранные бандлы и заменяет их "на лету"
	app.use(hotMiddleware(compiler));
} else {
	ssr = require('../build/build').default;

	app.use('/static', Express.static(path.resolve(__dirname, '../static'), {
		fallthrough: true,
		maxAge: 365 * 24 * 60 * 60 * 1000
	}));
}

// в режиме разработки не используем серверный рендеринг
app.get('/', function (req, res, next) {
	const appData = {
		staticHost: '/static',
		bundle: 'index',
		baseUrl: 'test',
		nonce: 'test'
	};
	ssr('index', req.url, appData)
		.then(html => {
			res.send(html);
		})
		.catch(err => next(err));
});

app.listen(8080, () => {
	console.log('http://localhost:8080');
});