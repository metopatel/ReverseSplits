const dotenv = require('dotenv');
dotenv.config();

const { loadDiscordCommands } = require('./modules/discord/discordCommands');
const { loadDiscordEvents } = require('./modules/discord/discordEvents');

(async () => {
    await loadDiscordEvents();
    await loadDiscordCommands();

    // START STOCK LIST ALERTER
    new (require('./modules/stockAlertUpdater'))();
})();

process.on('SIGTERM', process.exit.bind(this, 0));
process.on('SIGINT', process.exit.bind(this, 0));
process.on('exit', cleanup);

function cleanup() {
    console.log('Exit Signal Received, cleaning up...');
}