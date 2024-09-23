export class Command {

/**
 * @param {string[]} [validArgs=[]] - an array of arguments
 * @param {number} [globalCooldown=30] - global cooldown of the command in seconds (default 30)
 * @param {number} [userCooldown=30] - per user cooldown of the command in seconds (default 30)
 * @param {() => void} [callback=function(){}] - the function to execute
 */

    constructor (validArgs = [], globalCooldown = 30, userCooldown = 30, callback = function(){}) {
        this.validArgs = validArgs;
        this.globalCooldown = globalCooldown * 1000;
        this.userCooldown = userCooldown * 1000;
        this.callback = callback;

        this.allowedPerChannel = new Map();
        this.allowedPerChannelUser = new Map();

        this.help = '';

        setInterval(() => {
            const now = Date.now();

            for (const [key, time] of this.allowedPerChannel) {
                if (now > time) {
                    this.allowedPerChannel.delete(key);
                }
            }
            
            for (const [key, time] of this.allowedPerChannelUser) {
                if (now > time) {
                    this.allowedPerChannelUser.delete(key);
                }
            }

        }, 10 * 60 * 1000);

    }

    canExecute(channelId, userId) {
        const now = Date.now();

        if (this.globalCooldown) {
            const globalAllowedExecutionTime = this.allowedPerChannel.get(channelId);
            if (globalAllowedExecutionTime !== undefined && now < globalAllowedExecutionTime) return [false, parseInt((globalAllowedExecutionTime - now) / 1000)];
        }

        if (this.userCooldown) {
            const userAllowedExecutionTime = this.allowedPerChannelUser.get(`${channelId}:${userId}`);
            if (userAllowedExecutionTime !== undefined && now < userAllowedExecutionTime) return [false, parseInt((userAllowedExecutionTime - now) / 1000)];
        }

        return [true];
    }

    execute(channel, channelId, client, user, args) {
        const now = Date.now();

        if (this.callback(channel, channelId, client, user, args)) {
            
            if (this.globalCooldown) {
                this.allowedPerChannel.set(channelId, now + this.globalCooldown);
            }
    
            if (this.userCooldown) {
                this.allowedPerChannelUser.set(`${channelId}:${user.userId}`, now + this.userCooldown);
            }    
        }

    } 

    setHelp(help) {
        this.help = help;
    }

    getHelp() {
        return this.help;
    }

    getArgs() {
        return this.validArgs;
    }
}