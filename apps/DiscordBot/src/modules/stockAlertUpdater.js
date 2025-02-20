import { getMysqlConnection } from '@reverse-splits/mysqlConnector'

import { getDiscordClient } from './discord/discordClient';
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getCurrentQuote } from './stockListUpdater';

module.exports = class {
	constructor() {
		this.defs = {
			THREAD: {
				INTERVAL: 5 * 60 * 1000,
			},
		};

		this.init().then(() => {
			this.mainThread();
		});
	}

	init() {
		return new Promise(async (res) => {
			this.mysqlConnection = await getMysqlConnection();
			this.discordClient = await getDiscordClient(true);
			res();
		});
	}

	replayThread() {
		setTimeout(this.mainThread.bind(this), this.defs.THREAD.INTERVAL);
	}

	async mainThread() {
		try {
			const [stocksToPost] = await this.mysqlConnection.execute('SELECT * FROM stocks_to_post');

			if (stocksToPost.length == 0) return;

			stocksToPost.forEach(async (stock) => {
				const channel = await this.discordClient.channels.fetch(process.env.DISCORD_STOCK_ALERTS_CHANNEL);
				if (channel) {
					const stockPrice = await getCurrentQuote(stock['symbol']);
					const expectedProfit = (stockPrice) ? (Number(stockPrice) * (Number(stock['splitDenominator']) - 1)).toFixed(2) : 'No Stock Price';

					const stockEmbed = new EmbedBuilder()
						.setColor(0x0099FF)
						.setTitle('Stock Alert Received!')
						.setAuthor({ name: 'Reverse Splits' })
						.setDescription('A new reverse stock split has been posted.')
						.addFields(
							{ name: 'Company', value: stock['companyName'], inline: true },
							{ name: 'Symbol', value: stock['symbol'], inline: true },
							{ name: '\t', value: '\t' },
							{ name: 'Split Date', value: stock['exDate'].toDateString(), inline: true },
							{ name: 'Split Ratio', value: stock['splitRatio'], inline: true },
							{ name: '\t', value: '\t' },
							{ name: 'Stock Price', value: stockPrice?.toFixed(2).toString() ?? 'Failed to fetch', inline: true },
							{ name: 'Expected Profit', value: expectedProfit.toString(), inline: true },
						)
						.setTimestamp()
						.setFooter({ text: 'Provided by Reverse Splits' });

					// Build Buttons
					const roundUpButton = new ButtonBuilder()
						.setLabel('Round Up')
						.setCustomId('stock_round_up')
						.setStyle(ButtonStyle.Success);

					const roundDownButton = new ButtonBuilder()
						.setLabel('Round Down')
						.setCustomId('stock_round_down')
						.setStyle(ButtonStyle.Danger);

					const cashButton = new ButtonBuilder()
						.setLabel('Cash in Lieu')
						.setCustomId('stock_cash_in_lieu')
						.setStyle(ButtonStyle.Primary);

					const unknownButton = new ButtonBuilder()
						.setLabel('Unknown')
						.setCustomId('stock_unknown')
						.setStyle(ButtonStyle.Secondary);

					const row = new ActionRowBuilder()
						.addComponents(roundUpButton, roundDownButton, cashButton, unknownButton);

					// Send Embed to channel
					const message = await channel.send({ embeds: [stockEmbed], components: [row] });

					// Mark stock as prompted and insert messageId for tracking
					await this.mysqlConnection.execute('UPDATE reverse_split_actions SET posted = ?, discord_message_id = ? WHERE stock_id = ?', [true, message.id, stock['id']]);
					console.log('[STOCK ALERTS] => Finished Stock Alert (ID: %d)', stock['id']);
					return true;
				}
				else {
					const reason = 'Discord Stock alerts channel not found';
					console.log('[STOCK ALERTS] => Processing Stock Alert Failed (ID: %d): %s', stock['id'], reason);
					return false;
				}
			});
		}
		catch (err) {
			console.error(`[STOCK ALERTS] => ${err.stack}`);
		}
		finally {
			this.replayThread();
		}
	}
};