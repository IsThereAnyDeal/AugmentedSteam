
class LoginError extends Error {
    constructor(type: string) {
        super(type);
        this.name = "LoginError";
    }
}

class ServerOutageError extends Error {
    constructor(msg: string) {
        super(msg);
        this.name = "ServerOutageError";
    }
}

class OAuthUnauthorized extends Error {
    constructor(msg?: string) {
        super(msg);
        this.name = "OAuth Unauthorized";
    }
}

class HTTPError extends Error {
    public code: number;

    constructor(code: number, message: string) {
        super(message);
        this.code = code;
    }
}

export default {
    LoginError,
    ServerOutageError,
    HTTPError,
    OAuthUnauthorized
};
