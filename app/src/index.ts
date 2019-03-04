import { Logger } from "./logger";

// import { CBotConfig } from "./interface";
// import { WechatBot } from "./wechat-bot";

// async function main() {
//     const bot = new WechatBot(CBotConfig);
//     await bot.login();
// }

// main();

const logger = new Logger();
logger.info("Hello world");
logger.error("error");
