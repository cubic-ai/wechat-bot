import { CubicBot } from "./library/bot";
import { botConfig } from "./library/interface";

function main() {
    const bot = new CubicBot(botConfig);
    bot.run();
}

main();
