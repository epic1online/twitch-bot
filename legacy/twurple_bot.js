import { chatClient } from './chat_client.js';
import { pubSubClient } from './pubsub.js';
import { commands } from './commands.js';
import { addBalance } from './sqlite_handler.js';

const DEBUG = true;
const channelId = '';

chatClient.onMessage((channel, user, text, msg) => {
    if (!text.startsWith('!')) return;
    const args = text.toLowerCase().slice(1).split(' ');
    const command = args.shift();
    if (commands.hasOwnProperty(command)) {
        // commands[command].response(channel, msg.channelId, chatClient, msg.userInfo, args);
        if (commands[command].canExecute(msg.channelId, msg.userInfo.userId)[0]) {
            commands[command].execute(channel, msg.channelId, chatClient, msg.userInfo, args);
        } else {
            chatClient.say(channel, `that command isn't ready yet. (${commands[command].canExecute(msg.channelId, msg.userInfo.userId)[1]} seconds)`);
        }
    }
});

pubSubClient.onRedemption(channelId, (msg) => {
    if (DEBUG) console.log(`[${msg.redemptionDate.toTimeString().slice(0, 5)}] info: #[${msg.channelId}] <${msg.userName}> redeemed '${msg.rewardTitle}: ${msg.rewardPrompt}'`);
    if (!(msg.rewardTitle.toLowerCase() == 'convert to tokens')) return;
    const amount = parseInt(msg.rewardPrompt.toLowerCase().split(' ')[1]);
    addBalance(msg.channelId, msg.userId, amount);
    chatClient.say('epic1online', `@${msg.userDisplayName}, ${amount} tokens have been added to your balance`);
});

chatClient.connect();