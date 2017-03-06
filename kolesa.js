const qs       = require('querystring');
const $        = require('whacko');
const request  = require('request-promise');
const _        = require('lodash');
const RSS      = require('rss');
const Entities = require('html-entities').XmlEntities;

const cfg = require('./config.default.js');

module.exports = class Kolesa
{
	static _url(query)
	{
		const used = new Set();
		const get = k =>
			{
				used.add(k);
				return _.get(query, k, '');
			};
		const params = cfg.uriParams[query.type]
			.replace(/\:(\w+)\:/g, k => get(k.replace(/:/g, '')))
			.replace(/\(\/?\)/g, '') // empty blocks
			.replace(/\(|\)/g, '');  // non-empty blocks

		const bits = _.omit(query, [...used, 'type']);
		const queryS = qs.stringify(bits);

		return cfg.urlScheme
			.replace(':protocol:', cfg.protocol)
			.replace(':domain:', cfg.domain)
			.replace(':params:', params)
			.replace(':query:', queryS);
	}

	static _feedHTML(el)
	{
		if(_.isFunction(cfg.template))
			return cfg.template(el);

		const { encode: e } = Entities;

		const img = el.img
			? `<img src="${e(el.img)}/>`
			: '';

		return cfg.template
			.replace(/\:price\:/g,       e(el.price))
			.replace(/\:title\:/g,       e(el.title))
			.replace(/\:img\:/g,         img)
			.replace(/\:description\:/g, e(el.description))
			.replace(/\:city\:/g,        e(el.city))
			.replace(/\:date\:/g,        e(el.date.dateS))
			.trim();
	}

	static rss(name, items)
	{
		const feed = new RSS(
			{
				title: name,
				language: cfg.language
			});

		for(let el of items)
			feed.item(
				{
					title: el.title,
					description: this._feedHTML(el),
					url: el.link,
					date: el.date.pubDate
				});

		return feed.xml();
	}

	static _convert($node)
	{
		const { css } = cfg;
		const img = $node.find(css.image).attr('src');
		const title = $node.find(css.image).attr('alt');
		const link = $node.find(css.link).attr('href');
		const price = $node.find(css.price).text();
		const description = $node.find(css.description).text();
		const city = $node.find(css.city).text();
		const comments = $node.find(css.city).text();
		const date = cfg.parseDate($node.find('.date').text() || '');

		return { title, img, link, price, description, city, comments, date };
	}

	static async _fetchPage(url, page)
	{
		const urlPaged = url.replace(':page:', page);
		cfg.log(`fetch: ${urlPaged}`);
		const html = (await request(urlPaged));

		const $body = $(html);

		const items = $body
			.find(cfg.css.results)
			.toArray()
			.map(node => this._convert($(node)));

		const total = Number($body.find(cfg.css.pagesTotal).text());
		const active = Number($body.find(cfg.css.pageCurrent).text());

		return { active, total, items };
	}

	static async fetch(query)
	{
		const url = this._url(query);
		const page = await this._fetchPage(url, 0);

		const list = [...page.items];
		const total = Math.min(cfg.maxPages, page.total);

		for(let p of _.range(1, total))
		{
			const page = await this._fetchPage(url, p);
			list.push(...page.items);
		}

		return list;
	}
};