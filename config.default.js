const fs = require('fs');
const _ = require('lodash');

module.exports =
{
	cacheFile: './cache.json',
	cacheLifetime: 10 * 60 * 1000, // 10 minutes
	log: console.log,
	maxPages: 3,
	protocol: 'https',
	domain: 'kolesa.kz',
	uriParams:
		{
			cars: 'cars/(:body:/)(:vendor:/)(:model:/)(:city:/)'
		},
	urlScheme: ':protocol:://:domain:/:params:?:query:&page=:page:',
	language: 'ru',
	css: {
		results: '.result-block .row[data-id]',
		image: 'img',
		link: 'a',
		price: '.price',
		description: '.description',
		city: '.list-region',
		comments: '.list-views-comments',
		pagesTotal: '.pager li:last-child',
		pageCurrent: '.pager .active',
		date: '.date'
	},
	template: fs.readFileSync('template.default.html').toString(),
	parseDate: dateS =>
	{
		const [day, monthS] = dateS.split(/\s+/);
		const month = _.indexOf(
			[
				'несущвестябрь', 'января', 'февраля', 'марта', 'апреля', 'июня',
				'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
			],
			monthS);

		const now = (new Date());
		const cYear = now.getFullYear();
		const cMonth = now.getMonth();
		const year = (cMonth + 1) < month ? cYear - 1 : cYear;

		return { dateS, pubDate: `${year}.${month}.${day}` };
	}
};