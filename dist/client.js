"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatClient = exports.authProvider = void 0;
const auth_1 = require("@twurple/auth");
const chat_1 = require("@twurple/chat");
const api_1 = require("@twurple/api");
const console_1 = require("console");
const fs_1 = require("fs");
const webserver_1 = require("./webserver");
const balance = __importStar(require("./balance_manager"));
const listeners_1 = require("./listeners");
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const clientUserId = process.env.CLIENT_USER_ID;
var tokenData;
exports.authProvider = new auth_1.RefreshingAuthProvider({ clientId, clientSecret });
exports.authProvider.onRefresh((userId, newTokenData) => __awaiter(void 0, void 0, void 0, function* () { (0, fs_1.writeFileSync)(`./tokens.json`, JSON.stringify(newTokenData, null, 4), 'utf-8'); }));
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!(0, fs_1.existsSync)('./tokens.json')) {
            const code = yield (0, webserver_1.authCodeFlow)(clientId.toString(), clientSecret);
            const redirectUri = 'http://localhost:3000';
            tokenData = yield (0, auth_1.exchangeCode)(clientId.toString(), clientSecret, code, redirectUri);
            (0, fs_1.writeFileSync)(`./tokens.json`, JSON.stringify(tokenData, null, 4), 'utf-8');
        }
        try {
            const tokenFile = (0, fs_1.readFileSync)('./tokens.json', 'utf-8');
            tokenData = JSON.parse(tokenFile);
        }
        catch (e) {
            console.error(e);
        }
        exports.authProvider.addUser(clientUserId, tokenData);
        exports.authProvider.addIntentsToUser(clientUserId, ['chat']);
        const channelFile = (0, fs_1.readFileSync)('./channel-list.json', 'utf-8');
        const channelList = JSON.parse(channelFile);
        var opts = { authProvider: exports.authProvider, channels: channelList };
        exports.chatClient = new chat_1.ChatClient(opts);
        const apiClient = new api_1.ApiClient({ authProvider: exports.authProvider });
        exports.chatClient.onMessage((channel, user, text, msg) => {
            if (process.env.DEBUG === "true")
                console.log(`[${msg.date.toTimeString().slice(0, 5)}] info: #[${channel}] <${user}>: ${text}`);
            const command = text.toLowerCase().slice(1).split(' ').shift();
            if (msg.channelId == process.env.CLIENT_USER_ID) {
                if (command === "join") {
                    exports.chatClient.join(user);
                    const channelList = exports.chatClient.currentChannels;
                    channelList.push(`#${user}`);
                    (0, fs_1.writeFileSync)(`./channel-list.json`, JSON.stringify(channelList), 'utf-8');
                }
                else if (command === "part") {
                    exports.chatClient.part(user);
                    const channelList = exports.chatClient.currentChannels;
                    channelList.splice(channelList.indexOf(`#${user}`), 1);
                    (0, fs_1.writeFileSync)(`./channel-list.json`, JSON.stringify(channelList), 'utf-8');
                }
            }
        });
        exports.chatClient.onConnect(() => {
            console.log(`[${(new Date(Date.now())).toTimeString().slice(0, 5)}] info: connected to twitch servers`);
        });
        exports.chatClient.onDisconnect((manually, reason) => {
            const time = (new Date(Date.now())).toTimeString().slice(0, 5);
            if (reason)
                return console.error(`[${time}] error: ${console_1.error}`);
            console.log(`[${time}] info: disconnected from twitch servers. manual: ${manually}`);
        });
        exports.chatClient.onJoin((channel, _user) => __awaiter(this, void 0, void 0, function* () {
            console.log(`[${(new Date(Date.now())).toTimeString().slice(0, 5)}] info: joined channel #${channel}`);
            let emote = channel == 'epic1online' ? 'epic1o1Peek' : 'TwitchConHYPE';
            exports.chatClient.say(channel, `${emote} bot is connected`);
            const channelId = (yield apiClient.users.getUserByName(channel)).id;
            rewardsTimer(channelId, channel);
        }));
        exports.chatClient.onPart((channel, _user) => __awaiter(this, void 0, void 0, function* () {
            console.log(`[${(new Date(Date.now())).toTimeString().slice(0, 5)}] info: parted channel #${channel}`);
            exports.chatClient.say(channel, 'bot is leaving :(');
        }));
        function rewardsTimer(channelId, channel) {
            balance.createTable(channelId);
            setInterval(() => __awaiter(this, void 0, void 0, function* () {
                try {
                    (yield apiClient.asUser(clientUserId, (ctx) => __awaiter(this, void 0, void 0, function* () {
                        const request = ctx.chat.getChattersPaginated(channelId);
                        return yield request.getAll();
                    }))).forEach((x) => {
                        balance.add(channelId, x.userId, 50);
                    });
                }
                catch (e) {
                    if (JSON.parse(e.body).status === 403) {
                        console.error(`[${new Date().toTimeString().slice(0, 5)}] error: #[${channel}]: couldn't retrieve chatters (is bot modded?) 403 forbidden`);
                    }
                    else {
                        let err = new Error("error retrieving chatters");
                        err.stack += "\n\nCaused by: " + e.stack;
                        throw err;
                    }
                }
            }), 5 * 60 * 1000);
        }
        exports.chatClient.connect();
        (0, listeners_1.commandListener)();
    });
}
main();
//# sourceMappingURL=client.js.map