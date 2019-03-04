import { botConfig } from "./interface";
import { WechatBot } from "./wechat-bot";

async function main() {
    const bot = new WechatBot(botConfig);
    await bot.login();
}

main();
