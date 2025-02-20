import * as fs from 'node:fs';
import * as path from 'node:path';
import { getDiscordClient } from './discordClient';

import { REST, Routes, Collection } from 'discord.js';

const commands = [];

async function loadDiscordCommands() {
	const client = await getDiscordClient(false);

	client.commands = new Collection();

	const foldersPath = path.join(__dirname, '../../commands');
	const commandFolders = fs.readdirSync(foldersPath);

	for (const folder of commandFolders) {
		const commandsPath = path.join(foldersPath, folder);
		const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
		for (const file of commandFiles) {
			const filePath = path.join(commandsPath, file);
			const command = require(filePath);
			// Set a new item in the Collection with the key as the command name and the value as the exported module
			if ('data' in command && 'execute' in command) {
				commands.push(command.data.toJSON());
				client.commands.set(command.data.name, command);
			}
			else {
				console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
			}
		}
	}

	await deployCommandsToGuild();
}

async function deployCommandsToGuild() {
	const rest = new REST().setToken(process.env.DISCORD_TOKEN);

	try {
		console.log(`[Command Deployment] => Started refreshing ${commands.length} application (/) commands.`);

		// The put method is used to fully refresh all commands in the guild with the current set
		const data = await rest.put(
			Routes.applicationGuildCommands(process.env.DISCORD_APPLICATION_ID, process.env.DISCORD_GUILD_ID),
			{ body: commands },
		);

		console.log(`[Command Deployment] => Successfully reloaded ${data.length} application (/) commands.`);
	}
	catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
}

module.exports = {
	loadDiscordCommands,
};