import ASEventHandler from "@Content/Modules/ASEventHandler";
import AppId from "@Core/GameId/AppId";

interface TDOMGame {
    node: HTMLElement,
    appid?: AppId,
    title?: {
        node: HTMLElement,
        value: string|null,
    },
    platforms?: {
        node: HTMLElement
    }
}

interface TDOMStructure {
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
        const gameList = document.querySelector<HTMLElement>(".oI5QPBYWG8c-");
        if (!gameList) {
            this.dom = {};
        }

        const games: TDOMGame[] = [];
        for (const gameNode of document.querySelectorAll<HTMLElement>(".LSY1zV2DJSM-")) {
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

            const platformsNode = gameNode.querySelector<HTMLElement>(".vdNOP82JYX8-._-6uwAFLL9K0-");
            if (platformsNode) {
                game.platforms = {
                    node: platformsNode
                };
            }

            games.push(game);
        }

        this.dom = Object.freeze({
            gameList: {
                node: gameList!,
                games
            }
        });
    }

    titleNode(parent: HTMLElement): HTMLAnchorElement|null {
        return parent.querySelector<HTMLAnchorElement>("a.Fuz2JeT4RfI-[href*='/app/']");
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
            this.dom.gameList!.node,
            {
                subtree: true,
                childList: true,
                characterData: true
            }
        );
    }
}