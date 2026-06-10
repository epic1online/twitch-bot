import http from "http";

export function authCodeFlow(clientId: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const port = 3000;
        var code: string;
        const state = newState();

        const requestListener = function (request: any, response: any) {

            const searchParams = new URLSearchParams(request.url.substring(2));

            if (!searchParams.has("state")) {
                response.statusCode = 400;
                response.end("no state");
            } else if (searchParams.get("state") !== state) {
                response.statusCode = 400;
                response.end("state mismatch");
            } else if (searchParams.has("code")) {
                code = searchParams.get("code")
                response.write(`code is ${code}`);
                response.statusCode = 200;
                response.end("\nyou can close this window");
                server.close();
                resolve(code);

            } else {
                response.statusCode = 400;
                response.end("no code found");
                reject(new Error("No code found"));
            }
        }

        const server = http.createServer(requestListener);
        server.listen(port, () => {
            console.log(`Listening on http://localhost:${port}`);
        });

        const clientIdString = `client_id=${clientId}`;
        const redirectUriString = `redirect_uri=http://localhost:${port}`;
        const scopeString = 'scope=chat:edit%20chat:read%20moderator:read:chatters';
        const stateString = `state=${state}`;

        console.log('Click the link and login with your bot account');
        console.log(`https://id.twitch.tv/oauth2/authorize?response_type=code&${clientIdString}&${redirectUriString}&${scopeString}&${stateString}`);
    });
}

export function pubSubCode(clientId: string) {
    return new Promise((resolve, reject) => {
        const port = 3000;
        var code: string;
        const state = newState();

        const requestListener = function (request: any, response: any) {

            const searchParams = new URLSearchParams(request.url.substring(2));

            if (!searchParams.has("state")) {
                response.statusCode = 400;
                response.end("no state");
            } else if (searchParams.get("state") !== state) {
                response.statusCode = 400;
                response.end("state mismatch");
            } else if (searchParams.has("code")) {
                code = searchParams.get("code")
                response.write(`code is ${code}`);
                response.statusCode = 200;
                response.end("\nyou can close this window");
                server.close();
                resolve(code);

            } else {
                response.statusCode = 400;
                response.end("no code found");
                reject(new Error("No code found"));
            }
        }

        const server = http.createServer(requestListener);
        server.listen(port, () => {
            console.log(`Listening on http://localhost:${port}`);
        })

        const clientIdString = `client_id=${clientId}`;
        const redirectUriString = 'redirect_uri=http://localhost:3000';
        const scopeString = 'channel:read:redemptions';
        const stateString = `state=${state}`;

        console.log('Click the link and login with your account to enable channel point redemptions');
        console.log(`https://id.twitch.tv/oauth2/authorize?response_type=code&${clientIdString}&${redirectUriString}&${scopeString}&${stateString}`);

    });
}

function newState(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var stateArray = new Int8Array(40);

    globalThis.crypto.getRandomValues(stateArray);
    stateArray = stateArray.map(x => chars.charCodeAt(x % chars.length));

    return String.fromCharCode.apply(null, stateArray);
}