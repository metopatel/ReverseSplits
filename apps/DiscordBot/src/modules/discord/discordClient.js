import { Client, GatewayIntentBits } from 'discord.js';
import { ready } from '../../events/ready';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.login(process.env.DISCORD_TOKEN);

async function getDiscordClient(requireReady = true) {
	if (requireReady) {
		return new Promise(function waitForLoad(res) {
			if (ready()) {
				res(client);
			}
			else {
				setTimeout(waitForLoad, 1000, res);
			}
		});
	}
	else {
		return client;
	}
}

module.exports = { getDiscordClient };