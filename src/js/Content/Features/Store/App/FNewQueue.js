import {__queue_new, __queue_newTooltip} from "../../../../../localization/compiled/_strings";
import {L} from "../../../../Core/Localization/Localization";
import {HTML} from "../../../../modulesCore";
import {Feature} from "../../../modulesContent";
import {Page} from "../../Page";

export default class FNewQueue extends Feature {

    checkPrerequisites() {
        return document.querySelector(".finish_queue_text") !== null;
    }

    apply() {

        HTML.afterEnd(".btn_next_in_queue",
            `<div id="es_new_queue" class="btn_next_in_queue btn_next_in_queue_trigger" data-tooltip-text="${L(__queue_newTooltip)}">
                <div class="next_in_queue_content">
                    <span class="finish_queue_text">${L(__queue_new)}</span>
                </div>
            </div>`);

        Page.runInPageContext(() => {
            const f = window.SteamFacade;
            f.vTooltip("#es_new_queue");

            f.jqOnClick("#es_new_queue", () => {
                const queueType = f.global("g_eDiscoveryQueueType");
                f.jqAjax({
                    "url": `https://store.steampowered.com/explore/next/${queueType}/`,
                    "type": "POST",
                    "data": f.jq("#next_in_queue_form").serialize(),
                    "success": () => { window.location.href = `https://store.steampowered.com/explore/startnew/${queueType}/`; }

                    // TODO error handling, waiting on #231 and #275 to merge
                });
            });
        });
    }
}
