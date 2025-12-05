import self_ from "./FBackgroundPreviewLink.svelte";
import type CMarketListing from "@Content/Features/Community/MarketListing/CMarketListing";
import Feature from "@Content/Modules/Context/Feature";
import SteamFacade from "@Content/Modules/Facades/SteamFacade";
import {util} from "protobufjs";
import resolve = util.path.resolve;

export default class FBackgroundPreviewLink extends Feature<CMarketListing> {

    private itemInfoNode: HTMLElement|null = null;
    private link: string|null = null;

    override async checkPrerequisites(): Promise<boolean> {
        if (this.context.appid !== 753 || !this.context.user.isSignedIn) {
            return false;
        }

        this.itemInfoNode = document.querySelector(".largeiteminfo_react_placeholder");
        if (!this.itemInfoNode) {
            console.error("[FBackgroundPreviewLink] container not found");
            return false;
        }

        const assets = await SteamFacade.global("g_rgAssets");
        if (!assets) {
            console.error("[FBackgroundPreviewLink] assets not found");
            return false;
        }

        const asset = assets[753][6];
        if (!asset) {
            return false;
        }

        const data = Object.values(asset) as any;
        if (data.length === 0 || !data[0].actions[0].link) {
            return false
        }
        this.link = data[0].actions[0].link;
        return true;
    }

    private findImageNode(): HTMLImageElement|null {
        const doc = new XPathEvaluator();
        const xpath = doc.createExpression("//img[contains(@src, '330x192')][contains(@src, 'https://community.fastly.steamstatic.com/economy/image/')]")
        const result = xpath.evaluate(document, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE);

        if (result.snapshotLength > 0) {
            return result.snapshotItem(0) as HTMLImageElement; // assume only one element found, or the first one is the one we need
        }
        return null;
    }

    private async waitForNode(): Promise<HTMLImageElement> {
        return new Promise(resolve => {

            const node = this.findImageNode();
            if (node) {
                resolve(node);
                return;
            }

            const observer = new MutationObserver(() => {
                const node = this.findImageNode();
                if (node) {
                    resolve(node);
                    observer.disconnect();
                    return;
                }
            });
            observer.observe(this.itemInfoNode!, {
                childList: true,
                subtree: true
            });
        });
    }

    override async apply(): Promise<void> {
        const target = await this.waitForNode(); // we're assuming that we did our due diligence and we find the node

        const link = this.link!;

        let src: string|null = null;
        if (link.includes("/economy/images/")) {
            src = link.replace(/^(.+)(\/economy\/image\/)/, "$1")
        } else if (link.includes("/community_assets/images/items/")) {
            src = link.replace(/^(.+)\/community_assets\/images\/items\//, "");
        }

        if (src) {
            new self_({
                target: target.parentElement!,
                props: {
                    profileUrl: this.context.user.profileUrl,
                    background: src
                }
            });
        }
    }
}
