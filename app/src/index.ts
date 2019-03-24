import { botConfig } from "./interface";
import { Bot } from "./lib/bot";
import { Logger } from "./utils/logger";

async function main() {
    const logger = new Logger();
    const bot = new Bot(logger, botConfig);
    await bot.login();
}

main();
