import { commands, customCommands } from './stock_commands';
import { chatClient } from "./client";

export function commandListener() {

    chatClient.onMessage((channel, user, text, msg) => {
        if (!text.startsWith('!')) return;
        const args = text.toLowerCase().slice(1).split(' ');
        const command = args.shift();
        if (commands.hasOwnProperty(command)) {
            let cmd = commands[command];
            if (cmd.canExecute(msg.channelId, msg.userInfo.userId)[0]) {
                cmd.execute(channel, msg.channelId, chatClient, msg.userInfo, args);
            } else {
                chatClient.say(channel, `that command isn't ready yet. (${cmd.canExecute(msg.channelId, msg.userInfo.userId)[1]} seconds)`);
            }
        } else if (customCommands[msg.channelId].hasOwnProperty(command)) {
            let cmd = customCommands[msg.channelId][command];
            if (cmd.canExecute(msg.channelId, msg.userInfo.userId)[0]) {
                cmd.execute(channel, msg.channelId, chatClient, msg.userInfo, args);
            } else {
                chatClient.say(channel, `that command isn't ready yet. (${cmd.canExecute(msg.channelId, msg.userInfo.userId)[1]} seconds)`);
            }
        }
    });
}

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