import { Events } from 'discord.js';
import { getMysqlConnection } from '@reverse-splits/mysqlConnector';
import { getDiscordClient } from '../modules/discord/discordClient';
import { updateStockList } from '../modules/stockListUpdater';

async function handleCommand(interaction) {
    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`[Command Handler] => No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        await interaction.deferReply();
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
        } else {
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }
}

async function handleButton(interaction) {
    await interaction.deferReply({ ephemeral: true });
    switch (interaction.customId) {
        case 'stock_round_up':
        case 'stock_round_down':
        case 'stock_cash_in_lieu':
        case 'stock_unknown':
            markStockAction(interaction, interaction.customId);
            break;
        default:
            console.error(`[Command Handler] => No button matching ${interaction.customId} was found.`);
            return;
    }
}

async function markStockAction(interaction, action) {
    const mysqlConnection = await getMysqlConnection();
    const discordClient = await getDiscordClient();
    const messageId = interaction.message.id;

    const splitAction = ((id) => {
        switch (id) {
            case 'stock_round_up':
                return 'ROUND_UP';
            case 'stock_round_down':
                return 'ROUND_DOWN';
            case 'stock_cash_in_lieu':
                return 'CASH';
            case 'stock_unknown':
                return 'UNKNOWN';
            default:
                console.error(`[Button Handler] => Invalid Stock Action: ${id}!`);
                return null;
        }
    })(action);

    if (splitAction) {
        const result = await mysqlConnection.execute('UPDATE reverse_split_actions SET splitAction = ? WHERE discord_message_id = ?', [splitAction, messageId]);
        if (result[0].affectedRows > 0) {
            await updateStockList();
            if (process.env.DISCORD_STOCK_LIST_CHANNEL && splitAction == "ROUND_UP") {
                const channel = await discordClient.channels.fetch(process.env.DISCORD_STOCK_LIST_CHANNEL);
                if (channel) {
                    await channel.send('@here , Stock list updated!');
                }
            }
            const response = "Stock action successfully updated.";
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: response, ephemeral: true });
            } else {
                await interaction.reply({ content: response, ephemeral: true });
            }
        } else {
            console.error(`[Button Handler - Stock Action] => Failed to updated database for messageId: ${messageId}, stockAction: ${splitAction}`);
        }
    }
    
    await interaction.message.delete();
}

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        try {
            if (interaction.isChatInputCommand()) {
                await handleCommand(interaction);
            } else if (interaction.isButton()) {
                await handleButton(interaction);
            }
        } catch (err) {
            console.error(`[Discord Interaction Handler] => ${err.stack}`);
        }
        return;
    }
}