import { ChatClient, ChatUser } from "@twurple/chat";

export class Command {
    _help: string;
    _channelCooldown: number;
    _userCooldown: number;
    _callback: (channel: string, channelId: string | null, client: ChatClient, user: ChatUser, args: string[]) => boolean;

    _allowedPerChannel: Map<string | null, number> = new Map();
    _allowedPerChannelUser: Map<string, number> = new Map();

    constructor(help: string, channelCooldown: number, userCooldown: number, callback: (channel: string, channelId: string | null, client: ChatClient, user: ChatUser, args: string[]) => boolean) {
        this._help = help
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

    canExecute(channelId: string, userId: string) {
        const now = Date.now();

        if (this._channelCooldown) {
            const channelAllowedExecutionTime = this._allowedPerChannel.get(channelId);
            if (channelAllowedExecutionTime !== undefined && now < channelAllowedExecutionTime) return [false, Math.trunc((channelAllowedExecutionTime - now) / 1000)];
        }

        if (this._userCooldown) {
            const userAllowedExecutionTime = this._allowedPerChannelUser.get(`${channelId}:${userId}`);
            if (userAllowedExecutionTime !== undefined && now < userAllowedExecutionTime) return [false, Math.trunc((userAllowedExecutionTime - now) / 1000)];
        }

        return [true];
    }

    execute(channel: string, channelId: string, client: ChatClient, user: ChatUser, args: string[]) {
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

import Database from "better-sqlite3";
const db = new Database('./custom_commands.db');

export class CustomCommand extends Command {

    static getFromDB() {
        const channels: string[] = db.prepare("SELECT name FROM sqlite_schema WHERE type ='table' AND name NOT LIKE 'sqlite_%'").all().map((e: any) => { return e.name });
        var commandList: { [channelId: string]: { [command: string]: CustomCommand } } = {}

        for (const channelId of channels) {
            commandList[channelId] = {};

            const commands: IterableIterator<any> = db.prepare(`SELECT * FROM '${channelId}'`).iterate();
            for (const command of commands) {
                commandList[channelId][command.trigger] = new CustomCommand(channelId, command.trigger, command.response);
            }
        }
        return commandList;
    }

    _channelId: string;
    _trigger: string;
    _response: string

    constructor(channelId: string, trigger: string, response: string) {
        super('', 0, 0, function (channel, channelId, client, user, args) {
            client.say(channel, response);
            return true;
        });

        this._channelId = channelId;
        this._trigger = trigger;
        this._response = response;
    }

    private run(statement: string, binding: any) {
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

    edit(response: string) {
        this._response = response;
        let statement = `UPDATE '${this._channelId}' SET response = @response WHERE trigger = @trigger`;
        let binding = { trigger: this._trigger, response: this._response };
        this.run(statement, binding);
    }
}