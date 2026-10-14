import self_ from "./FDRMWarnings.svelte";
import Feature from "@Content/Modules/Context/Feature";
import {L} from "@Core/Localization/Localization";
import {__drmThirdParty, __drmThirdPartySub} from "@Strings/_strings";
import Settings from "@Options/Data/Settings";
import {mount} from "svelte";
import type IProductPageContext from "@Content/Features/Store/IProductPageContext";
import type CApp from "@Content/Features/Store/App/CApp";
import type CSub from "@Content/Features/Store/Sub/CSub";
import type CBundle from "@Content/Features/Store/Bundle/CBundle";

export default class FDRMWarnings extends Feature<(CApp|CSub|CBundle) & IProductPageContext> {

    // Exclude false-positives
    readonly #excludedAppids: number[] = [
        21690 // Resident Evil 5, at Capcom's request
    ];

    override async checkPrerequisites(): Promise<boolean> {
        return Settings.showdrm
            && (!this.context.appid || !this.#excludedAppids.includes(this.context.appid));
    }

    #getTextFromDRMNotices(): string[] {
        const value: string[] = [];
        for (const node of document.querySelectorAll<HTMLElement>(".DRM_notice")) {
            if (node.querySelector("a[onclick^=ShowEULA]")) { continue; }

            let text = "";
            for (const n of node.childNodes) {
                if (n.nodeType === Node.TEXT_NODE) {
                    text += n.textContent!.trim();
                } else if (n.nodeName === "BR") {
                    text += ", ";
                }
            }
            value.push(text);
        }
        return value;
    }

    #getTextFromGameDetails(): string {
        let value = "";
        let node: Node|null = document.querySelector(".language_list");
        if (!node) { return ""; }
        node = node.nextSibling;
        while (node !== null) {
            value += node.textContent;
            node = node.nextSibling;
        }
        return value;
    }

    override async apply(): Promise<void> {
        const isAppPage = this.context.appid !== null;

        let text = "";
        for (const node of document.querySelectorAll<HTMLElement>(".game_area_sys_req, #game_area_legal")) {
            text += node.textContent;
        }

        let drmNotices: string[] = [];
        let gameDetails: string = "";
        if (isAppPage) {
            drmNotices = this.#getTextFromDRMNotices();
            text += drmNotices.join("");
        } else {
            // Only bundle/sub pages have DRM info in game details
            gameDetails = this.#getTextFromGameDetails();
            text += gameDetails;
        }

        text = text.toLowerCase();

        const drmList: {name: string, enabled: boolean}[] = [
            {
                name: "Games for Windows Live",
                enabled: text.includes("games for windows live")
                    || text.includes("games for windows - live")
                    || text.includes("online play requires log-in to games for windows")
                    || text.includes("installation of the games for windows live software")
                    || text.includes("multiplayer play and other live features included at no charge")
                    || text.includes("www.gamesforwindows.com/live")
            },
            {
                name: "Ubisoft Connect",
                enabled: text.includes("uplay")
                    || text.includes("ubisoft account")
                    || text.includes("ubisoft connect")
            },
            {
                name: "SecuROM",
                enabled: text.includes("securom")
            },
            {
                name: "Tages",
                enabled: /\b(tages|solidshield)\b/.test(text) && !/angebote des tages/.test(text)
            },
            {
                name: "Stardock Account required",
                enabled: text.includes("stardock account")
            },
            {
                name: "Rockstar Social Club",
                enabled: text.includes("rockstar social club")
                    || text.includes("rockstar games social club")
            },
            {
                name: "Kalypso Launcher",
                enabled: text.includes("requires a kalypso account")
            },
            {
                name: "Denuvo Anti-Tamper",
                enabled: text.includes("denuvo")
            },
            {
                name: "EA app (Origin)",
                enabled: text.includes("origin client")
                    || text.includes("ea account")
                    || text.includes("ea app")
            },
            {
                name: "Microsoft Xbox Live",
                enabled: text.includes("xbox live")
            },
        ];

        const drmNames: string[] = drmList.flatMap(({name, enabled}) => enabled ? [name] : []);

        let drmString: string|undefined = undefined;
        if (drmNames.length > 0) {
            drmString = L(isAppPage ? __drmThirdParty : __drmThirdPartySub, {
                "drmlist": `(${drmNames.join(", ")})`
            });
        } else {
            const regex = /\b(drm|account|steam)\b/i;

            // Display the first "DRM Notice" or the text in game details that matches DRM/3rd party accounts
            if (isAppPage) {
                drmString = drmNotices.find(text => regex.test(text));
            } else if (regex.test(gameDetails)) {
                drmString = gameDetails;
            }
        }

        if (drmString) {
            const target = document.querySelector("#game_area_purchase, #game_area_purchase_top");
            if (!target) {
                throw new Error("Node not found");
            }

            (mount(self_, {
                target,
                anchor: target.firstElementChild!,
                props: {drmString}
            }));
        }
    }
}
