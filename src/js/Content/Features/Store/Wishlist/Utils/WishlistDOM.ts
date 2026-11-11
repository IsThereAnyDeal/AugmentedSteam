import ASEventHandler from "@Content/Modules/Events/ASEventHandler";
import AppId from "@Core/GameId/AppId";
import SelectorMap from "@Content/SelectorMap";

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

    dom: TDOMStructure = {};
    readonly onUpdate: ASEventHandler<void> = new ASEventHandler<void>();

    #update() {

        const parent = document.querySelector<HTMLElement>(SelectorMap.wishlist.parent);
        if (!parent) {
            console.error("Didn't find parent");
            this.dom = {};
            return;
        }

        const gameList = parent.querySelector<HTMLElement>(SelectorMap.wishlist.gameList);
        if (!gameList) {
            console.error("Didn't find gameList");
            this.dom = {};
            return;
        }

        const games: TDOMGame[] = [];
        for (const gameNode of gameList.querySelectorAll<HTMLElement>(SelectorMap.wishlist.game)) {
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
        return parent.querySelector(SelectorMap.wishlist.game)!;
    }

    titleNode(parent: HTMLElement): HTMLAnchorElement|null {
        return parent.querySelector<HTMLAnchorElement>(SelectorMap.wishlist.titleNode);
    }

    categoriesNode(parent: HTMLElement): HTMLAnchorElement|null {
        return parent.querySelector<HTMLAnchorElement>(SelectorMap.wishlist.categoriesNode);
    }

    priceNodes(parent: HTMLElement): {
        normal: HTMLElement|null,
        icon: HTMLElement|null,
        current: HTMLElement|null
    } {
        const parentPriceNode = parent.querySelector<HTMLElement>(SelectorMap.wishlist.prices.parent);
        const normalPriceNode = parentPriceNode?.querySelector<HTMLElement>(SelectorMap.wishlist.prices.normal) ?? null;
        const cutIconNode = parentPriceNode?.querySelector<HTMLElement>(SelectorMap.wishlist.prices.cutIconNode) ?? null;
        const currentNode = parentPriceNode?.querySelector<HTMLElement>(SelectorMap.wishlist.prices.current) ?? null;

        return {
            normal: normalPriceNode,
            icon: cutIconNode,
            current: currentNode
        }
    }

    appid(anchorNode: HTMLAnchorElement): AppId|null {
        const m = anchorNode.href.match(/app\/(\d+)/)!;
        return m ? new AppId(Number(m[1])) : null;
    }

    observe(): void {
        this.#update();

        const observer = new MutationObserver(() => {
            this.#update();
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