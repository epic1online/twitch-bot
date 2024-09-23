"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const stock_commands_1 = require("./stock_commands");
const client_1 = require("./client");
client_1.chatClient.onMessage((channel, user, text, msg) => {
    if (!text.startsWith('!'))
        return;
    const args = text.toLowerCase().slice(1).split(' ');
    const command = args.shift();
    if (stock_commands_1.commands.hasOwnProperty(command)) {
        if (stock_commands_1.commands[command].canExecute(msg.channelId, msg.userInfo.userId)[0]) {
            stock_commands_1.commands[command].execute(channel, msg.channelId, client_1.chatClient, msg.userInfo, args);
        }
        else {
            client_1.chatClient.say(channel, `that command isn't ready yet. (${stock_commands_1.commands[command].canExecute(msg.channelId, msg.userInfo.userId)[1]} seconds)`);
        }
    }
});
// import { pubSubClient} from "./client";
// import * as balance from "./balance_manager";
// const channelId = '405990924';
// pubSubClient.onRedemption(channelId, (msg) => {
//     if (process.env.DEBUG === "true") console.log(`[${msg.redemptionDate.toTimeString().slice(0, 5)}] info: #[${msg.channelId}] <${msg.userName}> redeemed '${msg.rewardTitle}: ${msg.rewardPrompt}'`);
//     if (!(msg.rewardTitle.toLowerCase() == 'convert to tokens')) return;
//     const amount = parseInt(msg.rewardPrompt.toLowerCase().split(' ')[1]);
//     balance.add(msg.channelId, msg.userId, amount);
//     chatClient.say('epic1online', `@${msg.userDisplayName}, ${amount} tokens have been added to your balance`);
// });
//# sourceMappingURL=listeners.js.map