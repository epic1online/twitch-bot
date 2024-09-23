import { RefreshingAuthProvider } from '@twurple/auth';
import { PubSubClient } from '@twurple/pubsub';
import { readFileSync, writeFileSync } from 'fs';

const clientId = '';
const clientSecret = '';
const channelId = ''

var tokenData = JSON.parse(readFileSync(`./tokens.${channelId}.json`, 'utf-8'));

const authProvider = new RefreshingAuthProvider ({ clientId, clientSecret });

authProvider.onRefresh(async (userId, newTokenData) => writeFileSync(`./tokens.${userId}.json`, JSON.stringify(newTokenData, null, 4), 'utf-8'));
authProvider.addUser(channelId, tokenData);

export const pubSubClient = new PubSubClient({ authProvider });