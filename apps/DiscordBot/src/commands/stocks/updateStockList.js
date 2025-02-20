import SlashCommandBuilder from 'discord.js';
import updateStockList from '../../modules/stockListUpdater';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('updatestocklist')
		.setDescription('Pushes a forced update to stock list'),
	async execute(interaction) {
		await updateStockList();
		await interaction.followUp('The stock list has updated');
	},
};