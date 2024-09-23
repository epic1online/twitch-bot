declare global {
    namespace NodeJS {
        interface ProcessEnv {
            CLIENT_ID: string;
            CLIENT_SECRET: string;
            CLIENT_USER_ID: string;
            DEBUG: string;
        }
    }
}

export { };