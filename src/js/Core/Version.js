import {Info} from "./Info";

class Version {

    constructor(major, minor = 0, patch = 0) {
        console.assert([major, minor, patch].filter(Number.isInteger).length === 3, `${major}.${minor}.${patch} must be integers`);
        this.major = major;
        this.minor = minor;
        this.patch = patch;
    }

    static from(version) {
        if (version instanceof Version) {
            return new Version(version.major, version.minor, version.patch);
        }
        if (typeof version == "string") {
            return Version.fromString(version);
        }
        if (Array.isArray(version)) {
            return Version.fromArray(version);
        }
        throw new Error(`Could not construct a Version from ${version}`);
    }

    static fromArray(version) {
        return new Version(...version.map(v => parseInt(v)));
    }

    static fromString(version) {
        return Version.fromArray(version.split("."));
    }

    static coerce(version) {
        if (version instanceof Version) {
            return version;
        }
        return Version.from(version);
    }

    toString() {
        return `${this.major}.${this.minor}.${this.patch}`;
    }

    toArray() {
        return [this.major, this.minor, this.patch];
    }

    toJSON() {
        return this.toString();
    }

    isCurrent() {
        return this.isSameOrAfter(Info.version);
    }

    isSame(version) {
        const _version = Version.coerce(version);
        return this.major === _version.major
            && this.minor === _version.minor
            && this.patch === _version.patch;
    }

    isBefore(version) {
        const _version = Version.coerce(version);
        if (this.major < _version.major) { return true; }
        if (this.major > _version.major) { return false; }

        // this.major == _version.major
        if (this.minor < _version.minor) { return true; }
        if (this.minor > _version.minor) { return false; }

        // this.minor == _version.minor
        if (this.patch < _version.patch) { return true; }
        return false;
    }

    isSameOrBefore(version) {
        return this.isSame(version) || this.isBefore(version);
    }

    isAfter(version) {
        const _version = Version.coerce(version);
        return _version.isBefore(this);
    }

    isSameOrAfter(version) {
        const _version = Version.coerce(version);
        return _version.isSameOrBefore(this);
    }
}

export {Version};
