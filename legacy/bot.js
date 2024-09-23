import { Client } from 'tmi.js';
import sqlite from 'better-sqlite3';
import { readFileSync, writeFileSync } from 'fs';
// const { parse } = require('path');

const db = new sqlite('./balances.db');

const clientId = '';
const clientSecret = '';

var tokens = JSON.parse(readFileSync('./tokens.json', 'utf-8'));

const commandHelp = {
    'echo': 'repeat whatever you say: !echo [message]',
    'flip': 'bet tokens on a coin flip: !flip [amount]',
    'roulette': 'bet tokens in a game of roulette: !roulette [amount] [bet]'
}
const gambaCommands = [ 'tokens', 'flip', 'roulette' ];


async function getNewTokens() {
    const response = await fetch('https://id.twitch.tv/oauth2/token', {
        method: 'POST',
        body: new URLSearchParams({
            'grant_type': 'refresh_token',
            'refresh_token': tokens.refreshToken,
            'client_id': clientId,
            'client_secret': clientSecret
        })
    });
    return await response.json();
}


async function main() {
    // const newTokens = await getNewTokens();
    // tokens.accessToken = newTokens.access_token;
    // tokens.refreshToken = newTokens.refresh_token;
    // writeFileSync('tokens.json', JSON.stringify(tokens));

    const client = new Client({
        options: { debug: true },
        identity: {
            username: 'DegenGamblingBot',
            password: tokens.accessToken
        },
        channels: ['epic1online']
    });

    client.connect();

    client.on('connected', (addr, port) => {
        console.log(`* Connected to ${addr}:${port}`);
    });

    client.on('join', (channel, username) => {
        var emote = channel == '#epic1online' ? 'epic1o1Peek' : 'TwitchConHYPE';
        if (client.getUsername() === username) {
            client.say(channel, `${emote} bot is connected`);
        }
    });

    let block = [];
    client.on('message', (channel, tags, message, self) => {
        if (self) return;
        const userid = parseInt(tags['user-id']);;
        const channelName = channel.slice(1);
        if (block[userid] === undefined) {
            block[userid] = {};
        }

        const blockid = block[userid];

        if (!message.startsWith('!')) {
            if ((blockid.hasOwnProperty('chatBonus') && blockid.chatBonus - Date.now() > 0)) return;
            db.prepare(`UPDATE ${channelName} SET balance = balance + @increment WHERE userId = @user`).run({increment: 50, user: userid});
            block[userid].chatBonus = Date.now() + (5 * 60 * 1000);
            return;
        }

        const args = message.toLowerCase().slice(1).split(' ');
        const command = args.shift();

        if (args.length == 0 && commandHelp.hasOwnProperty(command)) {
            return client.say(channel, `@${tags.username}, ${commandHelp[command]}`);
        }

        if (gambaCommands.includes(command) && !db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='${channelName}'`).get()) {
            return client.say(channel, `Gamba has not been enabled here D:`);
        }

        if (command === 'ping') {
            client.say(channel, `pong!`);
        } else if (command === 'echo') {
            client.say(channel, `@${tags.username}, you said: "${args.join(' ')}"`);

        } else if (command === 'init') {
            if (!tags.badges.hasOwnProperty('broadcaster')) return client.say(channel, `@${tags.username} you must be the broadcaster to use this command`);
            db.prepare(`CREATE TABLE IF NOT EXISTS ${channelName}(userId INT PRIMARY KEY, balance INT)`).run();
            client.say(channel, `@${tags.username}, gamba has be enabled :D`);
        } else if (command === 'tokens') {
            const row = db.prepare(`SELECT * FROM ${channelName} WHERE userId = @user`).get({user: userid});

            if (row == null) {
                db.prepare(`INSERT INTO ${channelName} (userId, balance) VALUES (@user, @initValue)`).run({user: userid, initValue: 3000});
                return client.say(channel, `@${tags.username} you've been given 3,000 tokens to get started :) happy gambling!`);
            } else {
                return client.say(channel, `@${tags.username} you have ${row.balance.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",")} tokens`);
            }

        } else if (command === 'flip') {
            var amount = parseInt(args[0]);

            const row = db.prepare(`SELECT * FROM ${channelName} WHERE userID = @user`).get({user: userid});

            if (row == null) {
                return client.say(channel, `@${tags.username} run the !tokens command to start earning tokens and gambling`);
            }
            var bal = row.balance;


            if (!(typeof blockid === undefined) && blockid.hasOwnProperty('coinflip') && blockid.coinflip > 0) {
                return client.say(channel, `@${tags.username} your coin is still somewhere on the floor, try again in ${Math.round((blockid.coinflip - Date.now()) / 1000)} seconds`);
            } else if (isNaN(amount) || amount <= 0) {
                return client.say(channel, `@${tags.username}, please enter a valid amount`);
            } else if (amount > bal) {
                return client.say(channel, `@${tags.username} you dont have enough tokens for that!`);
            }

            bal -= amount;

            const flip = Math.random();
            // console.log(flip);

            if (flip > 0.5) {
                amount *= 2;
                client.say(channel, `@${tags.username}, you win the coin flip and double the tokens you bet (+${amount.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",")})`);
            } else {
                amount = 0;
                client.say(channel, `@${tags.username}, you lose the coin flip...`);
            }

            bal += amount;

            db.prepare(`UPDATE ${channelName} set balance = @balance WHERE userId = @user`).run({balance: bal, user: userid});

            block[userid].coinflip = Date.now() + (30 * 1000);

            setTimeout(() => {
                block[userid].coinflip = 0;
            }, (30 * 1000));

        } else if (command === 'roulette') {
            if (args.length !== 2) return client.say(channel, `@${tags.username}, ${commandHelp[command]}`);

            var amount = parseInt(args[0]);
            const bet = args[1];
            const validBets = ['even', 'odd', 'red', 'black', 'high', 'low'];
            const winTables = {
                red: [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 1],
                black: [0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0],
                even: [0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
                odd: [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
                high: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                low: [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
            };

            const row = db.prepare(`SELECT * FROM ${channelName} WHERE userID = @user`).get({user: userid});

            if (row == null) {
                return client.say(channel, `@${tags.username} run the !balance command to start earning tokens and gambling`);
            }
            var bal = row.balance;

            if (!(typeof blockid === undefined) && blockid.hasOwnProperty('roulette') && blockid.roulette > 0) {
                return client.say(channel, `@${tags.username} your wheel is still cooling down, try again in ${Math.round((blockid.roulette - Date.now()) / 1000)} seconds`);
            } else if (!validBets.includes(bet) && isNaN(parseInt(bet)) && !parseInt(bet) >= 0 && !parseInt(bet) <= 36) {
                return client.say(channel, `@${tags.username}, please enter a valid bet. These include ${validBets}, and numbers 0 through 36`);
            } else if (isNaN(amount) || amount <= 0) {
                return client.say(channel, `@${tags.username}, please enter a valid amount`);
            } else if (amount > bal) {
                return client.say(channel, `@${tags.username} you dont have enough tokens for that!`);
            }

            bal -= amount;
            const roll = parseInt(Math.random() * 36);
            var msg = `@${tags.username} the ball lands on `
            if (roll == 0) msg += 'green 0 ';
            else if (winTables.red[roll]) {
                msg += `red ${roll} `
            } else {
                msg += `black ${roll} `
            }

            if (bet == roll) {
                amount *= 36;
                msg += 'and you won 36x your bet!!';
            } else {
                validBets.forEach(x => {
                    if (x == bet && winTables[x][roll]) {
                        amount *= 2;
                        msg += 'and you doubled your bet!'
                        return;
                    }
                });
                if (parseInt(args[0]) == amount) {
                    amount = 0;
                }
            }
            if (amount !== 0) msg += ` (+${amount.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",")})`;
            else msg += 'and you lost'

            client.say(channel, msg);

            bal += amount;

            db.prepare(`UPDATE ${channelName} set balance = ? WHERE userId = ?`).run(bal, userid);

            block[userid].roulette = Date.now() + (30 * 1000);

            setTimeout(() => {
                block[userid].roulette = 0;
            }, (30 * 1000));
        }
    });

}

main();