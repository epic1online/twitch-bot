import { exchangeCode, RefreshingAuthProvider } from '@twurple/auth';
import { ChatClient } from '@twurple/chat';
import { ApiClient, UserIdResolvable } from '@twurple/api';
import { error } from 'console';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { authCodeFlow } from './webserver';
import * as balance from './balance_manager';
import { messageListener } from './listeners';

const clientId: UserIdResolvable = process.env.CLIENT_ID;
const clientSecret: string = process.env.CLIENT_SECRET;
const clientUserId: UserIdResolvable = process.env.CLIENT_USER_ID;

var tokenData: any;

export const authProvider = new RefreshingAuthProvider({ clientId, clientSecret });
export var chatClient: ChatClient;

authProvider.onRefresh(async (userId, newTokenData) => { writeFileSync(`./tokens.json`, JSON.stringify(newTokenData, null, 4), 'utf-8') });

async function main() {

    if (!existsSync('./tokens.json')) {
        const code = await authCodeFlow(clientId.toString(), clientSecret);
        const redirectUri = 'http://localhost:3000';
        tokenData = await exchangeCode(clientId.toString(), clientSecret, code, redirectUri);
        writeFileSync(`./tokens.json`, JSON.stringify(tokenData, null, 4), 'utf-8');
    }

    try {
        const tokenFile = readFileSync('./tokens.json', 'utf-8');
        tokenData = JSON.parse(tokenFile);
    } catch (e) {
        console.error(e);
    }

    authProvider.addUser(clientUserId, tokenData);
    authProvider.addIntentsToUser(clientUserId, ['chat']);

    const channelFile = readFileSync('./channel-list.json', 'utf-8');
    const channelList = JSON.parse(channelFile).channels;
    console.log(channelList);

    var opts = { authProvider, channels: channelList };
    chatClient = new ChatClient(opts);
    const apiClient = new ApiClient({ authProvider });

    chatClient.onMessage((channel, user, text, msg) => {
        if (process.env.DEBUG === "true") console.log(`[${msg.date.toTimeString().slice(0, 5)}] info: #[${channel}] <${user}>: ${text}`);
    });

    chatClient.onConnect(() => {
        console.log(`[${(new Date(Date.now())).toTimeString().slice(0, 5)}] info: connected to twitch servers`);
    });

    chatClient.onDisconnect((manually, reason) => {
        const time: string = (new Date(Date.now())).toTimeString().slice(0, 5);
        if (reason) return console.error(`[${time}] error: ${error}`);
        console.log(`[${time}] info: disconnected from twitch servers. manual: ${manually}`);
    });

    chatClient.onJoin(async (channel, _user) => {
        console.log(`[${(new Date(Date.now())).toTimeString().slice(0, 5)}] info: joined channel #${channel}`);
        let emote = channel == 'epic1online' ? 'epic1o1Peek' : 'TwitchConHYPE';
        chatClient.say(channel, `${emote} bot is connected`);
        const channelId = (await apiClient.users.getUserByName(channel)).id;
        rewardsTimer(channelId);
    });


    function rewardsTimer(channelId: UserIdResolvable) {
        balance.createTable(channelId);
        setInterval(async () => {
            (await apiClient.asUser(clientUserId, async ctx => {
                const request = ctx.chat.getChattersPaginated(channelId);
                return await request.getAll();
            })).forEach((x) => {
                balance.add(channelId, x.userId, 50)
            });

        }, 5 * 60 * 1000);
    }

    chatClient.connect();
    messageListener();
}

main();