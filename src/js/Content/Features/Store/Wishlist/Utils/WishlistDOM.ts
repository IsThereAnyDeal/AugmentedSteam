import ASEventHandler from "@Content/Modules/ASEventHandler";
import AppId from "@Core/GameId/AppId";

interface TDOMGame {
    node: HTMLElement,
    appid?: AppId,
    title?: {
        node: HTMLElement,
        value: string|null,
    },
    categories: HTMLElement|null
}

interface TDOMStructure {
    parent?: HTMLElement,
    gameList?: {
        node: HTMLElement,
        games: Array<TDOMGame>
    }
}

export class WishlistDOM {

    public dom: TDOMStructure = {};
    public readonly onUpdate: ASEventHandler<void> = new ASEventHandler<void>();

    constructor() {
        this.update();
    }

    private update() {

        const parent = document.querySelector<HTMLElement>("section.jGMVnjZbmZM-");
        if (!parent) {
            console.error("Didn't find parent");
            this.dom = {};
            return;
        }

        const gameList = parent.querySelector<HTMLElement>(".PLkUpk974nY-.Panel");
        if (!gameList) {
            console.error("Didn't find gameList");
            this.dom = {};
            return;
        }

        const games: TDOMGame[] = [];
        for (const gameNode of gameList.querySelectorAll<HTMLElement>(".PE-3oq-yIvg-.Panel")) {
            const game: TDOMGame = {
                node: gameNode,
                categories: this.categoriesNode(gameNode)
            };

            const titleNode = this.titleNode(gameNode);
            if (titleNode) {
                game.title = {
                    node: titleNode,
                    value: titleNode?.textContent ?? null,
                }

                const appid = this.appid(titleNode);
                if (appid) {
                    game.appid = appid;
                }
            }

            games.push(game);
        }

        this.dom = Object.freeze({
            parent,
            gameList: {
                node: gameList!,
                games
            }
        });
    }

    gameNode(parent: HTMLElement): HTMLDivElement {
        return parent.querySelector(".PE-3oq-yIvg-")!;
    }

    titleNode(parent: HTMLElement): HTMLAnchorElement|null {
        return parent.querySelector<HTMLAnchorElement>("a.I8vuMMV-osE-[href*='/app/']");
    }

    categoriesNode(parent: HTMLElement): HTMLAnchorElement|null {
        return parent.querySelector<HTMLAnchorElement>(".lZzQoZsDjew-");
    }

    priceNodes(parent: HTMLElement): {
        normal: HTMLElement|null,
        icon: HTMLElement|null,
        current: HTMLElement|null,
        replacer: (cut: number) => void
    } {
        const parentPriceNode = parent.querySelector<HTMLElement>("._5obTMJByPr0-");
        const normalPriceNode = parentPriceNode?.querySelector<HTMLElement>(".sNExYpOoTBo- .r4XxdUG9Bg0-") ?? null;
        const cutIconNode = parentPriceNode?.querySelector<HTMLElement>(".rsMD9WnTopA-.OaA5Hz-VGBw-") ?? null;
        const currentNode = parentPriceNode?.querySelector<HTMLElement>(".-HQzBzl6lqI-") ?? null;
        const replacer = (cut: number) => {
            if (!cutIconNode) { return; }
            cutIconNode.classList.remove("OaA5Hz-VGBw-");

            const node = document.createElement("div");
            node.classList.add("hPiY1A-1izA-");
            node.innerText = `-${cut}%`;

            cutIconNode.replaceChildren(node);
        }

        return {
            normal: normalPriceNode,
            icon: cutIconNode,
            current: currentNode,
            replacer
        }
    }

    appid(anchorNode: HTMLAnchorElement): AppId|null {
        const m = anchorNode.href.match(/app\/(\d+)/)!;
        return m ? new AppId(Number(m[1])) : null;
    }

    observe(): void {
        const observer = new MutationObserver(() => {
            this.update();
            this.onUpdate.dispatch();
        });
        observer.observe(
            this.dom.parent!,
            {
                subtree: true,
                childList: true,
                characterData: true
            }
        );
    }
}