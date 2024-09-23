import { Command } from './bot_command.js';
import * as eco from './sqlite_handler.js';

export const commands = {
    ping: new Command(undefined, 0, 5, function (channel, channelId, client, user, args) {
        client.say(channel, 'pong!');
    }),
    echo: new Command(undefined, 0, undefined, function (channel, channelId, client, user, args) {
        client.say(channel, `@${user.userName}, you said: "${args.join(' ')}"`);
    }),
    initialize: new Command(undefined, 60, undefined, function (channel, channelId, client, user, args) {
        if (!user.isBroadcaster) {
            client.say(channel, `@${user.userName} you must be the broadcaster to use this command`);
            return false;
        }
        eco.initialize(channelId);
        client.say(channel, `@${user.userName}, economy has been initialized`);
        return true;
    }),
    tokens: new Command(undefined, 0, 15, function (channel, channelId, client, user, args) {
        client.say(channel, `@${user.userName} you have ${eco.getBalance(channelId, user.userId, true)} tokens`);
        return true;
    }),
    flip: new Command([0], 0, 30, function (channel, channelId, client, user, args) {
        this.setHelp('bet tokens in a coin flip: !flip [amount]');

        var amt = parseInt(args[0])
        if (args.length != 1 || isNaN(amt) || amt <= 0) {
            client.say(channel, `@${user.userName}, ${this.getHelp()}`)
            return false;
        } 

        var balance = eco.getBalance(channelId, user.userId);
        if (amt > balance) {
            client.say(channel, `@${user.userName} you don't have enough tokens for this (${balance} tokens)`);
            return false;
        }

        const flip = Math.random();
        if (flip > 0.5) {
            eco.addBalance(channelId, user.userId, amt);
            client.say(channel, `@${user.userName}, you win the coin flip and gain ${amt} tokens`);
        } else {
            eco.removeBalance(channelId, user.userId, amt);
            client.say(channel, `@${user.userName}, you lose the coin flip and lose ${amt} tokens`);
        }
        return true;
    }),
    roulette: new Command([0, ['even', 'odd', 'red', 'black', 'high', 'low']], 0, 30, function (channel, channelId, client, user, args) {
        var amt = parseInt(args[0]);
        var bet = args[1];
        this.setHelp('bet tokens in a game of roulette: !roulette [amount] [bet]');

        const validBets = this.getArgs()[1];
        if (args.length != 2 || isNaN(amt) || amt <= 0) {
            client.say(channel, `@${user.userName}, ${this.getHelp()}`);
            return false;
        }
        if (!validBets.includes(bet) && (parseInt(bet) < 0 || parseInt(bet) > 36)) {
            client.say(channel, `@${user.userName}, valid bets are ${validBets.toString().replaceAll(',', ', ')}, and numbers 0 through 36`);
            return false;
        }

        var balance = eco.getBalance(channelId, user.userId);
        if (amt > balance) {
            client.say(channel, `@${user.userName} you don't have enough tokens for this (${balance} tokens)`);
            return false;
        }

        const winTables = {
            red: [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 1],
            black: [0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0],
            even: [0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
            odd: [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
            high: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            low: [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        };

        const roll = parseInt(Math.random() * 36);
        var msg = `@${user.userName}, the ball lands on `

        if (roll == 0) msg += 'green 0 ';
        else if (winTables.red[roll]) msg += `red ${roll} `;
        else msg += `black ${roll} `;

        if (bet == roll) {
            msg += `and you won ${amt * 36} tokens!! PartyHat PartyHat`;
            eco.addBalance(channelId, user.userId, amt * 35);
        } else if (isNaN(parseInt(bet)) && winTables[bet][roll]) {
            msg += `and you won ${amt} tokens!`;
            eco.addBalance(channelId, user.userId, amt);
        } else {
            msg += `and you lost ${amt} tokens!`;
            eco.removeBalance(channelId, user.userId, amt);
        }
        client.say(channel, msg);
        return true;
    })
};