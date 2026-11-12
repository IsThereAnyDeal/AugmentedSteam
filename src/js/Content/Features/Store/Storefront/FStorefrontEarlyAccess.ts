import Feature from "@Content/Modules/Context/Feature";
import type CStoreFront from "@Content/Features/Store/Storefront/CStoreFront";
import {mount} from "svelte";
import EarlyAccessFlag from "@Content/Features/Store/Storefront/Components/EarlyAccessFlag.svelte";
import AugmentedSteamApiFacade from "@Content/Facades/AugmentedSteamApiFacade";
import Settings from "@Options/Data/Settings";

export default class FStorefrontEarlyAccess extends Feature<CStoreFront> {

    override async isEnabled(): Promise<boolean> {
        return Settings.show_early_access;
    }

    override async apply(): Promise<string|null> {
        this.#saleCapsules();
        this.#tabRowCapsules();
        this.context.moreContentEvent.subscribe(() => this.#moreContent());
        return null;
    }

    /**
     * Returns set of appid numbers as string, not as number to reduce unnecessary conversions
     */
    async #fetchEarlyAccess(...nodes: Array<NodeListOf<HTMLElement>>): Promise<Set<string>> {
        const appids: Set<number> = new Set();
        for (const group of nodes) {
            for (const node of group) {
                appids.add(Number(node.dataset.dsAppid));
            }
        }
        if (appids.size === 0) {
            return new Set();
        }

        const result = new Set<string>();
        const response = await AugmentedSteamApiFacade.isEarlyAccess([...appids]);
        for (let [appid, isEa] of Object.entries(response)) {
            if (isEa) {
                result.add(appid);
            }
        }
        return result;
    }

    #addFlag(target: Element): void {
        mount(EarlyAccessFlag, {target});
    }

    /*
     * Handles sections:
     * - Recommended based on the Games You Played
     * - Because you played
     * - Your Wishlist
     * - DLC for your Games
     * - Recently Updated
     * - From Developers you know
     * - Under
     * ...
     */
    async #saleCapsules(): Promise<void> {
        const nodes = document.querySelectorAll<HTMLElement>(".sale_capsule[data-ds-appid]");

        const ea = await this.#fetchEarlyAccess(nodes)
        if (ea.size === 0) {
            return;
        }

        for (const node of nodes) {
            if (ea.has(node.dataset.dsAppid!)) {
                const capsuleImage = node.querySelector(".capsule_image_ctn");
                if (!capsuleImage) {
                    console.warn("Did not find capsule_img_ctn");
                    continue;
                }

                this.#addFlag(capsuleImage);
            }
        }
    }

    async #tabRowCapsules(): Promise<void> {
        const nodes = document.querySelectorAll<HTMLElement>(".tab_row_item[data-ds-appid]");

        const ea = await this.#fetchEarlyAccess(nodes)
        if (ea.size === 0) {
            return;
        }

        for (const node of nodes) {
            if (ea.has(node.dataset.dsAppid!)) {
                this.#addFlag(node);
            }
        }
    }

    async #moreContent(): Promise<void> {
        // full width one game
        const single = document.querySelectorAll<HTMLElement>(".home_content.single .gamelink[data-ds-appid]:not([data-as-ea])");

        // other grids
        const items = document.querySelectorAll<HTMLElement>(".home_content_item[data-ds-appid]:not([data-as-ea])");

        const ea = await this.#fetchEarlyAccess(single, items)
        if (ea.size === 0) {
            return;
        }

        for (const node of [...single, ...items]) {
            node.dataset.asEa = "1";

            if (!ea.has(node.dataset.dsAppid!)) {
                continue;
            }

            const capsuleImage = node.querySelector(".capsule_image_ctn");
            if (!capsuleImage) {
                console.warn("Did not find capsule_img_ctn");
                continue;
            }

            this.#addFlag(capsuleImage);
        }
    }
}
