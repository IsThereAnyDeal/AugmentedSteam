import GameId from "@Core/GameId/GameId";
import {Background} from "../Background";
import {Messenger} from "../Messenger";
import {Page} from "../../Features/Page";

class DynamicStore {

    static onReady() {
        return Page.runInPageContext(() => new Promise(resolve => {
            window.GDynamicStore.OnReady(() => { resolve(); });
        }), null, true);
    }

    static invalidateCacheHandler() {

        Messenger.onMessage("GDynamicStore").then(isDefined => {
            if (isDefined) {
                Messenger.addMessageListener("DSInvalidateCache", DynamicStore.clear);
            }
        });

        Page.runInPageContext(() => {
            // `GDynamicStore` is defined in dynamicstore.js
            if (typeof window.GDynamicStore === "undefined") {
                window.Messenger.postMessage("GDynamicStore", false);
                return;
            }

            window.Messenger.postMessage("GDynamicStore", true);

            const oldFunc = window.GDynamicStore.InvalidateCache;
            window.GDynamicStore.InvalidateCache = function(...args) {
                oldFunc.call(this, args);

                window.Messenger.postMessage("DSInvalidateCache");
            };
        });
    }

    static clear() {
        return Background.action("dynamicstore.clear");
    }

    static async getAppStatus(storeId) {
        const multiple = Array.isArray(storeId);
        const storeIds = multiple ? storeId : [storeId];
        const trimmedIds = storeIds.map(id => GameId.trimStoreId(id));

        const dsStatus = await Background.action("dynamicstore.status", trimmedIds);

        const status = storeIds.reduce((acc, id, i) => {
            const trimmedId = trimmedIds[i];
            acc[id] = {
                "ignored": dsStatus[trimmedId].includes("ignored"),
                "ignoredOwned": dsStatus[trimmedId].includes("ignoredOwnedElsewhere"),
                "wishlisted": dsStatus[trimmedId].includes("wishlisted"),
            };
            if (id.startsWith("app/")) {
                acc[id].owned = dsStatus[trimmedId].includes("ownedApps");
            } else if (id.startsWith("sub/")) {
                acc[id].owned = dsStatus[trimmedId].includes("ownedPackages");
            }
            return acc;
        }, {});

        return multiple ? status : status[storeId];
    }

    static getRandomApp() {
        return Background.action("dynamicstore.randomapp");
    }
}

export {DynamicStore};
