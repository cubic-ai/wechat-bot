import { WeChatBot } from "./bot/bot";
import { cBotConfig } from "./bot/bot.interface";

function main() {
    const bot = new WeChatBot(cBotConfig);
    bot.start();
}

main();
