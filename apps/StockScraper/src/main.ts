import * as dotenv from 'dotenv';

dotenv.config();

(async () => {
  new (require('./modules/hedgeFollowHelper'))();
})();

process.on('SIGTERM', process.exit.bind(this, 0));
process.on('SIGINT', process.exit.bind(this, 0));
process.on("exit", cleanup)

function cleanup() {
  console.log("Exit Signal Received, cleaning up...");
}