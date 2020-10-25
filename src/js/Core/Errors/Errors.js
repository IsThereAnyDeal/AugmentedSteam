
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

const Errors = {
    "LoginError": LoginError,
    "ServerOutageError": ServerOutageError
};

export {Errors};
