import { botConfig } from "./interface";
import { Logger } from "./logger";
import { WechatBot } from "./wechat-bot";

async function main() {
    const logger = new Logger();
    const bot = new WechatBot(logger, botConfig);
    await bot.login();
}

main();
