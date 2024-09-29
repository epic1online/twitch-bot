"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomCommand = exports.Command = void 0;
class Command {
    constructor(help, channelCooldown, userCooldown, callback) {
        this._allowedPerChannel = new Map();
        this._allowedPerChannelUser = new Map();
        this._help = help;
        this._channelCooldown = channelCooldown * 1000;
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
        if (this._channelCooldown) {
            const channelAllowedExecutionTime = this._allowedPerChannel.get(channelId);
            if (channelAllowedExecutionTime !== undefined && now < channelAllowedExecutionTime)
                return [false, Math.trunc((channelAllowedExecutionTime - now) / 1000)];
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
            if (this._channelCooldown) {
                this._allowedPerChannel.set(channelId, now + this._channelCooldown);
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
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const db = new better_sqlite3_1.default('./custom_commands.db');
class CustomCommand extends Command {
    static getFromDB() {
        const channels = db.prepare("SELECT name FROM sqlite_schema WHERE type ='table' AND name NOT LIKE 'sqlite_%'").all().map((e) => { return e.name; });
        var commandList = {};
        for (const channelId of channels) {
            commandList[channelId] = {};
            const commands = db.prepare(`SELECT * FROM '${channelId}'`).iterate();
            for (const command of commands) {
                commandList[channelId][command.trigger] = new CustomCommand(channelId, command.trigger, command.response);
            }
        }
        return commandList;
    }
    constructor(channelId, trigger, response) {
        super('', 0, 0, function (channel, channelId, client, user, args) {
            client.say(channel, response);
            return true;
        });
        this._channelId = channelId;
        this._trigger = trigger;
        this._response = response;
    }
    run(statement, binding) {
        db.prepare(`CREATE TABLE IF NOT EXISTS '${this._channelId}'(trigger TEXT PRIMARY KEY, response TEXT)`).run();
        db.prepare(statement).run(binding);
    }
    save() {
        let statement = `INSERT INTO '${this._channelId}' (trigger, response) VALUES (@trigger, @response)`;
        let binding = { trigger: this._trigger, response: this._response };
        this.run(statement, binding);
    }
    delete() {
        let statement = `DELETE FROM '${this._channelId}' WHERE trigger = @trigger`;
        let binding = { trigger: this._trigger };
        this.run(statement, binding);
    }
    edit(response) {
        this._response = response;
        let statement = `UPDATE '${this._channelId}' SET response = @response WHERE trigger = @trigger`;
        let binding = { trigger: this._trigger, response: this._response };
        this.run(statement, binding);
    }
}
exports.CustomCommand = CustomCommand;
//# sourceMappingURL=command.js.map