import Info from "@Core/Info";

type VersionTypes = Version|string|Array<string|number>;

export default class Version {

    private readonly major: number;
    private readonly minor: number;
    private readonly patch:number;

    constructor(major: number, minor: number = 0, patch: number = 0) {
        console.assert([major, minor, patch].filter(Number.isInteger).length === 3, `${major}.${minor}.${patch} must be integers`);
        this.major = major;
        this.minor = minor;
        this.patch = patch;
    }

    static from(version: VersionTypes) {
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

    static fromArray(version: Array<string|number>): Version {
        if (version.length === 0) {
            throw new Error();
        }

        return new Version(
            Number(version[0]),
            Number(version[1] ?? 0),
            Number(version[2] ?? 0)
        );
    }

    static fromString(version: string): Version {
        return Version.fromArray(version.split("."));
    }

    static coerce(version: VersionTypes): Version {
        if (version instanceof Version) {
            return version;
        }
        return Version.from(version);
    }

    toString(): string {
        return `${this.major}.${this.minor}.${this.patch}`;
    }

    toArray(): [number, number, number] {
        return [this.major, this.minor, this.patch];
    }

    toJSON(): string {
        return this.toString();
    }

    isCurrent(): boolean {
        return this.isSameOrAfter(Info.version);
    }

    isSame(version: VersionTypes): boolean {
        const _version = Version.coerce(version);
        return this.major === _version.major
            && this.minor === _version.minor
            && this.patch === _version.patch;
    }

    isBefore(version: VersionTypes): boolean {
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

    isSameOrBefore(version: VersionTypes): boolean {
        return this.isSame(version) || this.isBefore(version);
    }

    isAfter(version: VersionTypes): boolean {
        const _version = Version.coerce(version);
        return _version.isBefore(this);
    }

    isSameOrAfter(version: VersionTypes): boolean {
        const _version = Version.coerce(version);
        return _version.isSameOrBefore(this);
    }
}
