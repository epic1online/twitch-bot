import http from "http";

export function authCodeFlow(clientId: string, clientSecret: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const port = 3000;
        var code: string;

        const requestListener = function (request: any, response: any) {

            const searchParams = new URLSearchParams(request.url.substring(2));

            if (searchParams.has("code")) {
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
        const redirectUriString = 'redirect_uri=http://localhost:3000';
        const scopeString = 'scope=chat:edit%20chat:read%20moderator:read:chatters';
        console.log('Click the link and login with your bot account');
        console.log(`https://id.twitch.tv/oauth2/authorize?response_type=code&${clientIdString}&${redirectUriString}&${scopeString}`);
    });
}