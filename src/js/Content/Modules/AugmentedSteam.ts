import {L} from "@Core/Localization/Localization";
import {__activate, __viewinclient,} from "@Strings/_strings";
import Settings from "@Options/Data/Settings";
import AugmentedSteamMenu from "@Content/Modules/Widgets/AugmentedSteam/AugmentedSteamMenu.svelte";
import CacheApiFacade from "@Content/Facades/CacheApiFacade";
import AugmentedSteamWarnings from "@Content/Modules/Widgets/AugmentedSteam/AugmentedSteamWarnings.svelte";
import Language from "@Core/Localization/Language";
import type UserInterface from "@Core/User/UserInterface";
import DynamicStore from "@Content/Modules/Data/DynamicStore";
import LocalStorage from "@Core/Storage/LocalStorage";
import {mount} from "svelte";

export default class AugmentedSteam {

    private warningComponent: AugmentedSteamWarnings|undefined;

    private readonly language: Language;
    private readonly user: UserInterface;
    private readonly react: boolean;

    constructor(
        language: Language|null,
        user: UserInterface,
        react: boolean
    ) {
        this.language = language ?? new Language("english");
        this.user = user;
        this.react = react;
    }

    private addMenu(): void {
        const target = document.querySelector(this.react
            ? "header nav + div"
            : "#global_action_menu"
        )!;

        mount(AugmentedSteamMenu, {
            target,
            anchor: target.firstElementChild!,
            props: {
                user: this.user
            }
        });
    }

    private addWarnings(): void {

        let target: Element|null;
        let anchor: Element|null;
        if (this.react) {
            target = document.querySelector("header ~ section");
            anchor = target?.firstElementChild ?? null;
        } else {
            const header = document.querySelector("#global_header")!
            target = header.parentElement!;
            anchor = header.nextElementSibling!;
        }

        if (target && anchor) {
            mount(AugmentedSteamWarnings, {
                target,
                anchor,
                props: {
                    react: this.react,
                    language: this.language
                }
            });
        } else {
            console.error("Did not find element for warnings");
        }
    }

    async build(): Promise<void> {

        const userId = this.user.steamId ?? "0";
        const cachedUser = await LocalStorage.get("cachedUser");

        if (cachedUser !== userId) {
            console.log(`Clear cache, old: ${cachedUser}, new: ${userId}`);
            await CacheApiFacade.clearCache();
            await LocalStorage.set("cachedUser", userId);
        }

        this.addMenu();
        this.addWarnings();

        if (this.user.isSignedIn) {
            // TODO probably doesn't used on React pages?
            DynamicStore.invalidateCacheHandler();
        }
    }
}
