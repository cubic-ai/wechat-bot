import { WeChatBot } from "./bot/bot";
import { cBotConfig } from "./bot/bot.interface";

async function main() {
    const bot = new WeChatBot(cBotConfig);
    await bot.login();
}
main();
// Switch to "old" stdin mode to keep main thread running without blocking it
process.stdin.resume();
