import self_ from "./FWorkshopFileSizes.svelte";
import {
    __calcWorkshopSize_calcLoading,
    __calcWorkshopSize_calcSize,
    __calcWorkshopSize_fileSize,
    __workshop_failed,
} from "@Strings/_strings";
import {L} from "@Core/Localization/Localization";
import type CMyWorkshop from "@Content/Features/Community/MyWorkshop/CMyWorkshop";
import Feature from "@Content/Modules/Context/Feature";
import HTML from "@Core/Html/Html";
import RequestData from "@Content/Modules/Data/RequestData";
import SteamCommunityApiFacade from "@Content/Facades/SteamCommunityApiFacade";
import BlockingWaitDialog from "@Core/Modals/BlockingWaitDialog";
import {MountTargetError} from "@Core/Errors/Errors";
import {mount} from "svelte";

export default class FWorkshopFileSizes extends Feature<CMyWorkshop> {

    #completed: number = 0;
    #failed: number = 0;
    #totalSize: number = 0;
    #total: number = 0;

    override async isEnabled(): Promise<boolean> {
        // FIXME settings
        return true;
    }

    override async apply(): Promise<string|null> {
        const paging = document.querySelector<HTMLElement>(".workshopBrowsePagingInfo");
        if (paging === null) {
            return "Paging info not found";
        }

        const pages = paging.textContent.replace(/,/g, "").match(/\d+/g);
        if (!pages) {
            return "Paging info not found";
        }
        this.#total = Math.max(...[...pages.values()].map(Number));

        const rightColumn = document.querySelector<HTMLElement>(".right_column");
        if (!rightColumn) {
            throw new MountTargetError();
        }

        mount(self_, {
            target: rightColumn.parentElement!,
            anchor: rightColumn.nextElementSibling ?? undefined,
            props: {
                oncalc: () => this.#startCalculation()
            }
        });

        this.#addFileSizes(); // Doesn't actually fetch any data unless total size has been calculated before

        return null;
    }

    async #addFileSizes(): Promise<void> {
        for (const node of document.querySelectorAll<HTMLElement>(".workshopItemSubscription[id*=Subscription]")) {
            if (node.classList.contains("as-has-filesize")) { continue; }

            const size = await this.#getFileSize(node, true).catch(e => console.error(e));
            if (!size) { continue; }

            const str = L(__calcWorkshopSize_fileSize, {"size": this.#getFileSizeStr(size)});
            HTML.beforeEnd(node.querySelector(".workshopItemSubscriptionDetails"), `<div class="workshopItemDate">${str}</div>`);
            node.classList.add("as-has-filesize");
        }
    }

    async #startCalculation(): Promise<{
        total: number,
        success: number,
        size: string
    }> {

        this.#completed = 0;
        this.#failed = 0;
        this.#totalSize = 0;

        const waitDialog = new BlockingWaitDialog(
            L(__calcWorkshopSize_calcSize),
            () => {
                const status = [];

                status.push(L(__calcWorkshopSize_calcLoading, {
                    i: this.#completed,
                    count: this.#total
                }));

                if (this.#failed > 0) {
                    status.push(L(__workshop_failed, {"n": this.#failed}));
                }
                return status;
            }
        );
        await waitDialog.update();

        const parser = new DOMParser();
        const url = new URL(window.location.origin + window.location.pathname);
        url.searchParams.set("browsefilter", "mysubscriptions");
        url.searchParams.set("numperpage", "30");

        for (let p: number = 1; p <= Math.ceil(this.#total / 30); p++) {
            url.searchParams.set("p", String(p));

            let result: string|null = null;
            try {
                result = await RequestData.getText(url)
            } catch (e) {
                console.error(e);
                console.error(`Failed to request ${url}`);
                continue;
            }

            const doc = parser.parseFromString(result, "text/html");
            for (const node of doc.querySelectorAll<HTMLElement>(".workshopItemSubscription[id*=Subscription]")) {
                try {
                    const size = await this.#getFileSize(node) ?? 0;

                    this.#completed++;
                    this.#totalSize += size;
                } catch (err) {
                    this.#failed++;
                    console.error(err);
                } finally {
                    await waitDialog.update();
                }
            }
        }
        waitDialog.dismiss();

        this.#addFileSizes(); // Add file sizes now that data has been fetched

        return {
            success: this.#completed,
            total: this.#total,
            size: this.#getFileSizeStr(this.#totalSize)
        }
    }

    #getFileSizeStr(size: number): string {
        const units = ["TB", "GB", "MB", "KB"];

        const index = units.findIndex((_unit, i) => size / (1000 ** (units.length - (i + 1))) >= 1);
        return `${(size / (1000 ** (units.length - (index + 1)))).toFixed(2)} ${units[index]}`;
    }

    async #getFileSize(node: HTMLElement, preventFetch = false): Promise<number|null> {
        const id = Number(node.id.replace("Subscription", ""));
        return await SteamCommunityApiFacade.getWorkshopFileSize(id, preventFetch)
    }
}
