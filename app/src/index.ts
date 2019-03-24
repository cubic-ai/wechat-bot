import { Bot } from "./library/bot";
import { botConfig } from "./library/interface";

function main() {
    const bot = new Bot(botConfig);
    bot.run();
}

main();
