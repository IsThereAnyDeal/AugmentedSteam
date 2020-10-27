
class LoginError extends Error {
    constructor(type) {
        super(type);
        this.name = "LoginError";
    }
}

class ServerOutageError extends Error {
    constructor(msg) {
        super(msg);
        this.name = "ServerOutageError";
    }
}

export class HTTPError extends Error {
    constructor(code, message) {
        super(message);
        this.code = code;
    }
}

const Errors = {
    "LoginError": LoginError,
    "ServerOutageError": ServerOutageError,
    "HTTPError": HTTPError
};

export {Errors};
