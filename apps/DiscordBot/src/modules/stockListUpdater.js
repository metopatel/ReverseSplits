import { getMysqlConnection } from '@reverse-splits/mysqlConnector'
import { getDiscordClient } from './discord/discordClient';
import { EmbedBuilder } from 'discord.js';

async function updateStockList() {
	const mysqlConnection = await getMysqlConnection();
	const discordClient = await getDiscordClient(true);

	try {
		const [stocksToBuy] = await mysqlConnection.execute('SELECT * FROM get_buy_stocks');
		const [stocksToSell] = await mysqlConnection.execute('SELECT * FROM get_sell_stocks');

		const buyStrings = [];
		for (const [_, stock] of Object.entries(stocksToBuy.sort((a, b) => { return new Date(a['exDate']) - new Date(b['exDate']); }))) {
			const stockPrice = await getCurrentQuote(stock['symbol']);
			const expectedProfit = (stockPrice) ? (Number(stockPrice) * (Number(stock['splitDenominator']) - 1)).toFixed(2) : 'No Stock Price';
			buyStrings.push(`- **${stock['symbol']}** (${stock['companyName']}) \r\n - Split: ${stock['splitRatio']}\r\n - __BUY BEFORE ${stock['exDate'].toDateString()}__\r\n - Expected Profit: ${expectedProfit}`);
		}

		const sellStrings = [];
		for (const [_, stock] of Object.entries(stocksToSell.sort((a, b) => { return new Date(b['exDate']) - new Date(a['exDate']); }))) {
			sellStrings.push(`- ${stock['companyName']} (**${stock['symbol']}**) : SPLIT ON ${stock['exDate'].toDateString()}`);
		}

		// Build Embed
		const stockListEmbed = new EmbedBuilder()
			.setColor(0x57f287)
			.setTitle('Current Stock List')
			.setDescription('The following is a list of stocks to buy or sell.\r\n\r\n**BUY**: The buy list consist of stocks that will be performing reverse splits in the future\r\n**SELL**: The sell list consist of stocks that have already split and you can sell\r\n')
			.setFooter({ text: 'Updates provided by Reverse Splits. Last Updated:' })
			.setTimestamp();

		if (buyStrings.length > 0) { stockListEmbed.addFields({ name: 'STOCKS TO BUY', value: buyStrings.join('\r\n') }); }
		if (sellStrings.length > 0) { stockListEmbed.addFields({ name: 'STOCKS TO SELL', value: sellStrings.join('\r\n') }); }

		if (process.env.DISCORD_STOCK_LIST_CHANNEL) {
			const channel = await discordClient.channels.fetch(process.env.DISCORD_STOCK_LIST_CHANNEL);
			if (channel) {
				const fetched = await channel.messages.fetch({ limit: 100, cache: false });
				if (fetched.size > 0) {
					await channel.bulkDelete(fetched);
				}
			}
			await channel.send({ embeds: [stockListEmbed] });
		}
	}
	catch (err) {
		console.error(`[STOCK LIST UPDATER] => Stack: ${err.stack}`);
	}
}

async function getCurrentQuote(symbol) {
	return new Promise(function getQuote(res) {
		fetch(`https://api.nasdaq.com/api/quote/${symbol.toUpperCase()}/info?assetclass=stocks`)
			.then(async (resp) => {
				const stockInfo = await resp.json();
				if (stockInfo.data) { res(Number(stockInfo.data.primaryData.lastSalePrice.replace('$', ''))); }
				else { res(null); }
			}).catch((err) => {
				console.log(`[StockQuote] => ${err.stack}`);
				res(null);
			});
	});
}


module.exports = {
	updateStockList,
	getCurrentQuote,
};