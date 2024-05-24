import type CApp from "@Content/Features/Store/App/CApp";
import Feature from "@Content/Modules/Context/Feature";
import HTML from "@Core/Html/Html";
import {__queue_new, __queue_newTooltip} from "@Strings/_strings";
import {L} from "@Core/Localization/Localization";
import DOMHelper from "@Content/Modules/DOMHelper";

export default class FNewQueue extends Feature<CApp> {

    override checkPrerequisites(): boolean {
        return document.querySelector(".finish_queue_text") !== null;
    }

    override apply(): void {

        HTML.afterEnd(".btn_next_in_queue",
            `<div id="es_new_queue" class="btn_next_in_queue btn_next_in_queue_trigger" data-tooltip-text="${L(__queue_newTooltip)}">
                <div class="next_in_queue_content">
                    <span class="finish_queue_text">${L(__queue_new)}</span>
                </div>
            </div>`);

        DOMHelper.insertScript("scriptlets/Store/App/newQueue.js");
    }
}
