import { ChatClient, ChatUser } from "@twurple/chat";

export class Command {

    // _validArgs: any[];
    _help: string;
    _globalCooldown: number;
    _userCooldown: number;
    _callback: (channel: string, channelId: string | null, client: ChatClient, user: ChatUser, args: string[]) => boolean;

    _allowedPerChannel: Map<string | null, number> = new Map();
    _allowedPerChannelUser: Map<string, number> = new Map();

    constructor(/*validArgs: any[], */help: string, globalCooldown: number, userCooldown: number, callback: (channel: string, channelId: string | null, client: ChatClient, user: ChatUser, args: string[]) => boolean) {
        // this._validArgs = validArgs;
        this._help = help
        this._globalCooldown = globalCooldown * 1000;
        this._userCooldown = userCooldown * 1000;
        this._callback = callback;

        setInterval(() => {
            const now = Date.now();

            for (const [key, time] of this._allowedPerChannel) {
                if (now > time) {
                    this._allowedPerChannel.delete(key);
                }
            }

            for (const [key, time] of this._allowedPerChannelUser) {
                if (now > time) {
                    this._allowedPerChannelUser.delete(key);
                }
            }

        }, 10 * 60 * 1000);

    }

    canExecute(channelId: string | null, userId: string) {
        const now = Date.now();

        if (this._globalCooldown) {
            const globalAllowedExecutionTime = this._allowedPerChannel.get(channelId);
            if (globalAllowedExecutionTime !== undefined && now < globalAllowedExecutionTime) return [false, Math.trunc((globalAllowedExecutionTime - now) / 1000)];
        }

        if (this._userCooldown) {
            const userAllowedExecutionTime = this._allowedPerChannelUser.get(`${channelId}:${userId}`);
            if (userAllowedExecutionTime !== undefined && now < userAllowedExecutionTime) return [false, Math.trunc((userAllowedExecutionTime - now) / 1000)];
        }

        return [true];
    }

    execute(channel: string, channelId: string | null, client: ChatClient, user: ChatUser, args: string[]) {
        const now = Date.now();

        if (this._callback(channel, channelId, client, user, args)) {

            if (this._globalCooldown) {
                this._allowedPerChannel.set(channelId, now + this._globalCooldown);
            }

            if (this._userCooldown) {
                this._allowedPerChannelUser.set(`${channelId}:${user.userId}`, now + this._userCooldown);
            }
        }

    }

    getHelp() {
        return this._help;
    }

    // getArgs() {
    //     return this._validArgs;
    // }
}