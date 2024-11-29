import {Appid} from "@Content/Modules/Highlights/StoreIds";

let id: number = 0;

export class WishlistDOM {

    private readonly listeners: Map<number, () => void> = new Map();

    gameList(): HTMLElement|null {
        return document.querySelector(".oI5QPBYWG8c-");
    }

    *gameNodes(): Generator<HTMLElement> {
        const nodes = document.querySelectorAll<HTMLElement>(".LSY1zV2DJSM-");
        for (const node of nodes) {
            yield node;
        }
    }

    titleNode(gameNode: HTMLElement): HTMLAnchorElement|null {
        return gameNode.querySelector<HTMLAnchorElement>("a.Fuz2JeT4RfI-[href*='/app/']");
    }

    title(titleNode: HTMLElement): string|null {
        return titleNode.textContent ?? null;
    }

    appid(titleNode: HTMLAnchorElement): Appid {
        const m = titleNode.href.match(/app\/(\d+)/)!;
        return new Appid(Number(m[1]));
    }

    platformsNode(gameNode: HTMLElement): HTMLElement|null {
        return gameNode.querySelector<HTMLElement>(".vdNOP82JYX8-._-6uwAFLL9K0-");
    }

    observe(): void {
        const observer = new MutationObserver(() => {
            for (let callback of this.listeners.values()) {
                callback();
            }
        });
        observer.observe(
            this.gameList()!,
            {
                subtree: true,
                childList: true,
                characterData: true
            }
        );
    }

    onChange(callback: () => void): () => void {
        ++id;
        this.listeners.set(id, callback);
        return () => {
            this.listeners.delete(id);
        }
    }
}