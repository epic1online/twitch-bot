import { RefreshingAuthProvider } from '@twurple/auth';
import { ChatClient } from '@twurple/chat';
import { ApiClient } from '@twurple/api';
import { addBalance } from './sqlite_handler.js';
import { error } from 'console';
import { readFileSync, writeFileSync } from 'fs';

const DEBUG = true;

const clientId = '';
const clientSecret = '';
const clientUserId = '';

var tokenData = JSON.parse(readFileSync('./tokens.json', 'utf-8'));

export const authProvider = new RefreshingAuthProvider({ clientId, clientSecret });

authProvider.onRefresh(async (userId, newTokenData) => writeFileSync(`./tokens.json`, JSON.stringify(newTokenData, null, 4), 'utf-8'));
authProvider.addUser(clientUserId, tokenData);
authProvider.addIntentsToUser(clientUserId, ['chat']);

var opts = { authProvider, channels: ['epic1online'] };
export const chatClient = new ChatClient(opts);

chatClient.onMessage((channel, user, text, msg) => {
    if (DEBUG) console.log(`[${msg.date.toTimeString().slice(0, 5)}] info: #[${channel}] <${user}>: ${text}`);
});

chatClient.onConnect(() => {
    console.log(`[${(new Date(Date.now())).toTimeString().slice(0, 5)}] info: connected to twitch servers`);
});

chatClient.onDisconnect((manually, reason) => {
    time = (new Date(Date.now())).toTimeString().slice(0, 5);
    if (reason) return console.error(`[${time}] error: ${error}`);
    console.log(`[${time}] info: disconnected from twitch servers. manual: ${manually}`);
});

chatClient.onJoin(async (channel, user) => {
    console.log(`[${(new Date(Date.now())).toTimeString().slice(0, 5)}] info: joined channel #${channel}`);
    var emote = channel == 'epic1online' ? 'epic1o1Peek' : 'TwitchConHYPE';
    chatClient.say(channel, `${emote} bot is connected`);
    const channelId = (await apiClient.users.getUserByName(channel)).id;
    rewardsTimer(channelId);
});


const apiClient = new ApiClient({ authProvider });
function rewardsTimer(channelId) {
    setInterval(async () => {
        (await apiClient.asUser(clientUserId, async ctx => {
            const request = ctx.chat.getChattersPaginated(channelId);
            return await request.getAll();
        })).forEach((x) => {
            addBalance(channelId, x.userId, 50)
        });

    }, 5 * 60 * 1000);
}