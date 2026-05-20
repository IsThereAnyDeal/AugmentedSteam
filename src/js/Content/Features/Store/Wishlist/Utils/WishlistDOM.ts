import ASEventHandler from "@Content/Modules/ASEventHandler";
import AppId from "@Core/GameId/AppId";

interface TDOMGame {
    node: HTMLElement,
    appid?: AppId,
    title?: {
        node: HTMLElement,
        value: string|null,
    }
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

        const parent = document.querySelector<HTMLElement>("section.GHIW6-Wf1rQ-");
        if (!parent) {
            console.error("Didn't find parent");
            this.dom = {};
            return;
        }

        const gameList = parent.querySelector<HTMLElement>(".PU7fdVEQB8s-.Panel");
        if (!gameList) {
            console.error("Didn't find gameList");
            this.dom = {};
            return;
        }

        const games: TDOMGame[] = [];
        for (const gameNode of gameList.querySelectorAll<HTMLElement>(".c-Pw-ER6JnA-.Panel")) {
            const game: TDOMGame = {
                node: gameNode
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

    titleNode(parent: HTMLElement): HTMLAnchorElement|null {
        return parent.querySelector<HTMLAnchorElement>("a.pOyXxbQoV38-[href*='/app/']");
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