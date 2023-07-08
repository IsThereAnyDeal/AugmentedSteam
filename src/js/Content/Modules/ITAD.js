import {ExtensionResources, HTML, Localization, SyncedStorage, TimeUtils} from "../../modulesCore";
import {Background, User} from "../modulesContent";

class ITAD {
    static async create() {
        if (!await Background.action("itad.isconnected")) { return; }

        HTML.afterBegin("#global_action_menu",
            `<div id="es_itad">
                <img id="es_itad_logo" src="${ExtensionResources.getURL("img/itad.png")}">
                <span id="es_itad_status">✓</span>
            </div>`);

        document.querySelector("#es_itad").addEventListener("mouseenter", ITAD.onHover);

        if (User.isSignedIn && (SyncedStorage.get("itad_import_library") || SyncedStorage.get("itad_import_wishlist"))) {
            Background.action("itad.import");
        }
    }

    static async onHover() {

        async function updateLastImport() {
            const {from, to} = await Background.action("itad.lastimport");

            let htmlStr
                = `<div>${Localization.str.itad.from}</div>
                   <div>${from ? new Date(from * 1000).toLocaleString() : Localization.str.never}</div>`;

            if (SyncedStorage.get("itad_import_library") || SyncedStorage.get("itad_import_wishlist")) {
                htmlStr
                    += `<div>${Localization.str.itad.to}</div>
                        <div>${to ? new Date(to * 1000).toLocaleString() : Localization.str.never}</div>`;
            }

            HTML.inner(".es-itad-hover__last-import", htmlStr);
        }

        if (!document.querySelector(".es-itad-hover")) {
            HTML.afterEnd("#es_itad_status",
                `<div class="es-itad-hover">
                    <div class="es-itad-hover__content">
                        <h4>${Localization.str.itad.last_import}</h4>
                        <div class="es-itad-hover__last-import"></div>
                        <div class="es-itad-hover__sync-now">
                            <span class="es-itad-hover__sync-now-text">${Localization.str.itad.sync_now}</span>
                            <div class="loader"></div>
                            <span class="es-itad-hover__sync-failed">&#10060;</span>
                            <span class="es-itad-hover__sync-success">&#10003;</span>
                        </div>
                    </div>
                    <div class="es-itad-hover__arrow"></div>
                </div>`);

            const hover = document.querySelector(".es-itad-hover");

            const syncDiv = document.querySelector(".es-itad-hover__sync-now");
            document.querySelector(".es-itad-hover__sync-now-text").addEventListener("click", async() => {
                syncDiv.classList.remove("es-itad-hover__sync-now--failed", "es-itad-hover__sync-now--success");
                syncDiv.classList.add("es-itad-hover__sync-now--loading");
                hover.style.display = "block";

                let timeout;

                try {
                    await Background.action("itad.sync");
                    syncDiv.classList.add("es-itad-hover__sync-now--success");
                    await updateLastImport();

                    timeout = 1000;
                } catch (err) {
                    syncDiv.classList.add("es-itad-hover__sync-now--failed");

                    console.group("ITAD sync");
                    console.error("Failed to sync with ITAD");
                    console.error(err);
                    console.groupEnd();

                    timeout = 3000;
                } finally {
                    TimeUtils.timer(timeout).then(() => { hover.style.display = ""; });
                    syncDiv.classList.remove("es-itad-hover__sync-now--loading");
                }
            });
        }

        await updateLastImport();
    }

    static async getAppStatus(storeId, options) {

        if (!await Background.action("itad.isconnected")) { return null; }

        const opts = {
            "waitlist": true,
            "collection": true,
            ...options
        };

        if (!opts.collection && !opts.waitlist) { return null; }

        const multiple = Array.isArray(storeId);
        const storeIds = multiple ? storeId : [storeId];

        const [inCollection, inWaitlist] = await Promise.all([
            opts.collection ? Background.action("itad.incollection", storeIds) : Promise.resolve(),
            opts.waitlist ? Background.action("itad.inwaitlist", storeIds) : Promise.resolve(),
        ]);

        if (!inCollection && !inWaitlist) { return null; }

        const status = storeIds.reduce((acc, id) => {
            acc[id] = {
                "collected": inCollection ? inCollection[id] : false,
                "waitlisted": inWaitlist ? inWaitlist[id] : false,
            };
            return acc;
        }, {});

        return multiple ? status : status[storeId];
    }
}

export {ITAD};
