
export class LoginError extends Error {
    constructor(type: string) {
        super(type);
        this.name = "LoginError";
    }
}

export class ServerOutageError extends Error {
    constructor(msg: string) {
        super(msg);
        this.name = "ServerOutageError";
    }
}

export class OAuthUnauthorized extends Error {
    constructor(msg?: string) {
        super(msg);
        this.name = "OAuth Unauthorized";
    }
}

export class HTTPError extends Error {
    public code: number;

    constructor(code: number, message: string) {
        super(message);
        this.code = code;
    }
}

export class MountTargetError extends Error {
    constructor(message: string = "Did not find target node to mount a feature") {
        super(message);
    }
}

// TODO @deprecated
export default {
    LoginError,
    ServerOutageError,
    HTTPError,
    OAuthUnauthorized,
    MountTargetError
};
