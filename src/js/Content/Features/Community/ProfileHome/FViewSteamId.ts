import self_ from "./FViewSteamId.svelte";
import type CProfileHome from "@Content/Features/Community/ProfileHome/CProfileHome";
import Feature from "@Content/Modules/Context/Feature";
import Settings from "@Options/Data/Settings";

export default class FViewSteamId extends Feature<CProfileHome> {

    override checkPrerequisites(): boolean {
        return Settings.profile_steamid && this.context.steamId !== null;
    }

    override apply(): void {

        const steamId = new SteamIdDetail(this.context.steamId!);
        const ids = [
            steamId.id2,
            steamId.id3,
            steamId.id64,
            steamId.id64hex,
            `https://steamcommunity.com/profiles/${steamId.id64}`
        ];

        const dropdown = document.querySelector("#profile_action_dropdown .popup_body.popup_menu");
        if (dropdown) {
            new self_({
                target: dropdown,
                props: {ids}
            });
        } else {
            const actions = document.querySelector(".profile_header_actions");
            if (actions) {
                new self_({
                    target: actions,
                    props: {
                        ids,
                        ownProfile: true
                    }
                });
            }
        }
    }
}

class SteamIdDetail {

    /*
     * @see https://developer.valvesoftware.com/wiki/SteamID
     */

    private readonly _y: number;
    private readonly _accountNumber: number;
    private readonly _instance: number;
    private readonly _type: number;
    private readonly _universe: number;
    private readonly _steamId64: string;

    constructor(steam64str: string) {
        if (!steam64str) {
            throw new Error("Missing first parameter 'steam64str'.");
        }

        const [upper32, lower32] = this.getBinary(steam64str);
        this._y = lower32 & 1;
        this._accountNumber = (lower32 & (((1 << 31) - 1) << 1)) >> 1;
        this._instance = (upper32 & ((1 << 20) - 1));
        this._type = (upper32 & (((1 << 4) - 1) << 20)) >> 20;
        this._universe = (upper32 & (((1 << 8) - 1) << 24)) >> 24;

        this._steamId64 = steam64str;
    }

    private divide(str: string|number[]): [number[], 1|0] {
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

    private getBinary(str: string): [number, number] {
        let upper32 = 0;
        let lower32 = 0;
        let index = 0;
        let bit = 0;
        let _str: string|number[] = str;
        do {
            [_str, bit] = this.divide(_str);

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

    get id2(): string {
        return `STEAM_${this._universe}:${this._y}:${this._accountNumber}`;
    }

    get id3(): string|null {
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

    get id64(): string {
        return this._steamId64;
    }

    get id64hex(): string {
        return `steam:${BigInt(this._steamId64).toString(16)}`;
    }
}
