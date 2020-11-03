
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

class HTTPError extends Error {
    constructor(code, message) {
        super(message);
        this.code = code;
    }
}


class FeatureDependencyError extends Error {
    constructor(msg, featureName) {
        super(msg);
        this.featureName = featureName;
    }
}

const Errors = {
    "LoginError": LoginError,
    "ServerOutageError": ServerOutageError,
    "HTTPError": HTTPError,
    "FeatureDependencyError": FeatureDependencyError
};

export {Errors};
