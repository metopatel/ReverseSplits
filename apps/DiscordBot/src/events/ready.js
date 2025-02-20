import { Events } from 'discord.js';

let ready = false;

module.exports = {
    name: Events.ClientReady,
    once: true,
    ready: () => { return ready; },
    execute(client) {
        ready = true;
        console.log(`[Discord] => Logged in as ${client.user.tag}`);
    }
}