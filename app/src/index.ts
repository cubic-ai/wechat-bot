import { CBotConfig } from "./interface";
import { WechatBot } from "./wechat-bot";

function main() {
    const bot = new WechatBot(CBotConfig);
    bot.login();
}

main();
