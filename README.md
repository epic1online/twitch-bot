# DegenGamblingBot
A Twitch chat bot to help chatters satisfy their gambling addiction

### Features
- Chatters earn coins by watching the stream.
- Gambling commands
- Convert twitch native channel points into tokens (coming soon)

### Commands
- !ping: pong!
- !echo [message]: repeats message
- !tokens: checks your current token balance, initializes your balance if it wasn't already set up
- !gamble [amount]: wager your tokens for a chance to double them
- !roulette [amount] ['even', 'odd', 'red', 'black', 'high', 'low', 1-36]: wager your tokens in a game of roulette
- !addcommand [keyword] [response]: add a command to say 'response' whenever !'keyword' is used **
- !editcommand [keyword] [response]: edits an existing custom command
- !delcommand [keyword]: deletes and existing keyword

** Custom commands are not currently persistent

### Technology used
- TypeScript
- Node
- OAuth2.0
- [Twurple](https://twurple.js.org)
- [better-sqlite3](https://www.npmjs.com/package/better-sqlite3)
- [dotenvx](https://dotenvx.com)
