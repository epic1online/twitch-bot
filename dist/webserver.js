"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authCodeFlow = authCodeFlow;
const http_1 = __importDefault(require("http"));
function authCodeFlow(clientId, clientSecret) {
    return new Promise((resolve, reject) => {
        const port = 3000;
        var code;
        const requestListener = function (request, response) {
            const searchParams = new URLSearchParams(request.url.substring(2));
            if (searchParams.has("code")) {
                code = searchParams.get("code");
                response.write(`code is ${code}`);
                response.statusCode = 200;
                response.end("\nyou can close this window");
                server.close();
                resolve(code);
            }
            else {
                response.statusCode = 400;
                response.end("no code found");
                reject(new Error("No code found"));
            }
        };
        const server = http_1.default.createServer(requestListener);
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
//# sourceMappingURL=webserver.js.map