const fs = require('fs-promise');

const Kolesa = require('./kolesa');
const cfg = require('./config.default');
const queries = require('./queries.json');

const [,, name] = process.argv;
const query = queries[name];

async function main(name)
{
	let cache;

	try
	{
		await fs.stat(cfg.cacheFile);
		cache = require(cfg.cacheFile);

		if(cache[name] && Date.now() - cache[name].date < cfg.cacheLifetime)
			return cache[name].rss;
	}
	catch(err){ cache = {}; }

	const items = await Kolesa.fetch(query);
	const rss = Kolesa.rss(`kolesa-rss-${name}`, items);

	cache[name] = { rss, date: Date.now() };
	await fs.writeFileSync(cfg.cacheFile, JSON.stringify(cache, null, '\t'));

	return rss;
}

main(name)
	.then(console.log)
	.catch(err =>
	{
		console.log(err.message);
		process.exit(0);
	});