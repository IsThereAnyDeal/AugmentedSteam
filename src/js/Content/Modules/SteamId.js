import HTMLParser from "@Core/Html/HtmlParser";

class SteamId {

    static getSteamId() {
        if (SteamId._steamId) { return SteamId._steamId; }

        if (document.querySelector("#reportAbuseModal")) {
            SteamId._steamId = document.querySelector("input[name=abuseID]").value;
        } else {
            SteamId._steamId = HTMLParser.getStringVariable("g_steamID");
        }

        if (!SteamId._steamId) {
            const profileData = HTMLParser.getObjectVariable("g_rgProfileData");
            SteamId._steamId = profileData.steamid;
        }

        return SteamId._steamId;
    }
}

class SteamIdDetail {

    /*
     * @see https://developer.valvesoftware.com/wiki/SteamID
     */

    constructor(steam64str) {
        if (!steam64str) {
            throw new Error("Missing first parameter 'steam64str'.");
        }

        const [upper32, lower32] = this._getBinary(steam64str);
        this._y = lower32 & 1;
        this._accountNumber = (lower32 & (((1 << 31) - 1) << 1)) >> 1;
        this._instance = (upper32 & ((1 << 20) - 1));
        this._type = (upper32 & (((1 << 4) - 1) << 20)) >> 20;
        this._universe = (upper32 & (((1 << 8) - 1) << 24)) >> 24;

        this._steamId64 = steam64str;
    }

    _divide(str) {
        const length = str.length;
        const result = [];
        let num = 0;
        for (let i = 0; i < length; i++) {
            num += Number(str[i]);

            const r = Math.floor(num / 2);
            num = ((num - (2 * r)) * 10);

            if (r !== 0 || result.length !== 0) {
                result.push(r);
            }
        }

        return [result, num > 0 ? 1 : 0];
    }

    _getBinary(str) {
        let upper32 = 0;
        let lower32 = 0;
        let index = 0;
        let bit = 0;
        let _str = str;
        do {
            [_str, bit] = this._divide(_str);

            if (bit) {
                if (index < 32) {
                    lower32 |= (1 << index);
                } else {
                    upper32 |= (1 << (index - 32));
                }
            }

            index++;
        } while (_str.length > 0);

        return [upper32, lower32];
    }

    get id2() {
        return `STEAM_${this._universe}:${this._y}:${this._accountNumber}`;
    }

    get id3() {
        const map = new Map(
            [
                [0, "I"], // invalid
                [1, "U"], // individual
                [2, "M"], // multiset
                [3, "G"], // game server
                [4, "A"], // anon game server
                [5, "P"], // pending
                [6, "C"], // content server
                [7, "g"], // clan
                // [8, "T / L / C"], // chat // TODO no idea what does this mean
                [9, "a"] // anon user
            ]
        );

        let type = null;
        if (map.has(this._type)) {
            type = map.get(this._type);
        }

        if (!type) {
            return null;
        }

        return `[${type}:${this._universe}:${(this._accountNumber << 1) | this._y}]`;
    }

    get id64() {
        return this._steamId64;
    }

    get id64hex() {
        return `steam:${BigInt(this._steamId64).toString(16)}`;
    }
}

export {SteamId, SteamIdDetail};
