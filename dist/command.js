"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomCommand = exports.Command = void 0;
const stock_commands_1 = require("./stock_commands");
class Command {
    constructor(/*validArgs: any[], */ help, globalCooldown, userCooldown, callback) {
        this._allowedPerChannel = new Map();
        this._allowedPerChannelUser = new Map();
        // this._validArgs = validArgs;
        this._help = help;
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
    canExecute(channelId, userId) {
        const now = Date.now();
        if (this._globalCooldown) {
            const globalAllowedExecutionTime = this._allowedPerChannel.get(channelId);
            if (globalAllowedExecutionTime !== undefined && now < globalAllowedExecutionTime)
                return [false, Math.trunc((globalAllowedExecutionTime - now) / 1000)];
        }
        if (this._userCooldown) {
            const userAllowedExecutionTime = this._allowedPerChannelUser.get(`${channelId}:${userId}`);
            if (userAllowedExecutionTime !== undefined && now < userAllowedExecutionTime)
                return [false, Math.trunc((userAllowedExecutionTime - now) / 1000)];
        }
        return [true];
    }
    execute(channel, channelId, client, user, args) {
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
}
exports.Command = Command;
class CustomCommand extends Command {
    constructor(trigger, response) {
        super('', 0, 0, function (channel, channelId, client, user, args) {
            client.say(channel, response);
            return true;
        });
        stock_commands_1.commands[trigger] = this;
    }
}
exports.CustomCommand = CustomCommand;
//# sourceMappingURL=command.js.map