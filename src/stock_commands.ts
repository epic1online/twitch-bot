import { Command } from "./command";
import * as balance from "./balance_manager"

export var commands: { [command: string]: Command } = {
    ping: new Command('', 0, 5, function (channel, channelId, client, user, args) {
        client.say(channel, 'pong!');
        return true;
    }),
    echo: new Command('', 0, 30, function (channel, channelId, client, user, args) {
        client.say(channel, args.join(' '));
        return true;
    }),
    tokens: new Command('', 0, 5, function (channel, channelId, client, user, args) {
        client.say(channel, `@${user.userName} has ${balance.getString(channelId, user.userId)} tokens`);
        return true;
    }),
    gamble: new Command('gamble your tokens: !gamble [amount]', 0, 30, function (channel, channelId, client, user, args) {
        let amt = parseInt(args[0]);

        if (args.length != 1 || isNaN(amt) || amt <= 0) {
            client.say(channel, `@${user.userName}, ${this.getHelp()}`);
            return false;
        }

        let userBal = balance.get(channelId, user.userId);
        if (amt > userBal) {
            client.say(channel, `@${user.userName} you don't have enough tokens for this (${userBal} tokens)`);
            return false;
        }

        const roll = Math.random();

        if (roll > 0.5) {
            balance.add(channelId, user.userId, amt);
            client.say(channel, `@${user.userName} wins ${amt} tokens!! They now have ${userBal + amt} tokens`);
        } else {
            balance.remove(channelId, user.userId, amt);
            client.say(channel, `@${user.userName} loses ${amt} tokens. They now have ${userBal - amt} tokens`);
        }
        return true;
    }),
    roulette: new Command('bet tokens in a game of roulette: !roulette [amount] [bet]', 0, 5, function (channel, channelId, client, user, args) {
        const validBets = ['even', 'odd', 'red', 'black', 'high', 'low'];

        const amt = parseInt(args[0]);
        const bet = args[1];
        const userBal = balance.get(channelId, user.userId);

        if (args.length != 2 || isNaN(amt) || amt <= 0) {
            client.say(channel, `@${user.userName}, ${this.getHelp()}`);
            return false;
        } else if (!validBets.includes(bet) && (parseInt(bet) < 0 || parseInt(bet) > 36)) {
            client.say(channel, `@${user.userName}, valid bets are ${validBets.toString().replace(',', ', ')}, and numbers 0 through 36`);
            return false;
        } else if (amt > userBal) {
            client.say(channel, `@${user.userName} you don't have enough tokens for this (${balance} tokens)`);
            return false;
        }

        const winChart: { [bet: string]: number[] } = {
            red: [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 1],
            black: [0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0],
            even: [0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
            odd: [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
            high: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            low: [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        }

        const roll = Math.round(Math.random() * 36);
        console.log(roll);
        var msg = "the ball lands on ";

        if (roll == 0) msg += 'green 0 ';
        else if (winChart.red[roll]) msg += `red ${roll} `;
        else msg += `black ${roll} `;

        msg += `and @${user.userName} `

        if (!isNaN(parseInt(bet)) && parseInt(bet) === roll) {
            msg += `won ${amt * 36} tokens!! PartyHat PartyHat `;
            balance.add(channelId, user.userId, amt * 35);
        } else if (isNaN(parseInt(bet)) && winChart[bet][roll]) {
            msg += `won ${amt} tokens! `;
            balance.add(channelId, user.userId, amt);
        } else {
            msg += `lost ${amt} tokens D: `;
            balance.remove(channelId, user.userId, amt);
        }
        msg += `They now have ${balance.get(channelId, user.userId)} tokens`
        client.say(channel, msg);
        return true;
    })
}