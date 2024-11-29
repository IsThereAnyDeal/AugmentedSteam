import Feature from "@Content/Modules/Context/Feature";
import HTML from "@Core/Html/Html";
import {L} from "@Core/Localization/Localization";
import TimeUtils from "@Core/Utils/TimeUtils";
import {
    __activateMultiple,
    __activateMultipleHeader,
    __activateProducts,
    __cancel,
    __close,
    __error,
    __register_already,
    __register_default,
    __register_dlc,
    __register_invalid,
    __register_notavail,
    __register_owned,
    __register_success,
    __register_toomany,
    __register_wallet,
} from "@Strings/_strings";
import type CRegisterKey from "@Content/Features/Store/RegisterKey/CRegisterKey";
import ExtensionResources from "@Core/ExtensionResources";
import RequestData from "@Content/Modules/RequestData";
import SteamFacade from "@Content/Modules/Facades/SteamFacade";

export default class FMultiProductKeys extends Feature<CRegisterKey> {

    // @ts-ignore
    private _template: string;

    override apply(): void {

        this._template
            = ` <div id="es_activate_modal">
                    <div id="es_activate_modal_content">
                        <div class="newmodal_prompt_with_textarea gray_bevel fullwidth" id="es_activate_input_text">
                            <textarea name="es_key_input" id="es_key_input" rows="24" cols="12" maxlength="1080">__alreadyentered__</textarea>
                        </div>
                        <div class="es_activate_buttons" style="float: right">
                            <div class="es_activate_modal_submit btn_green_steamui btn_medium">
                                <span>${L(__activateProducts)}</span>
                            </div>
                            <div class="es_activate_modal_close btn_grey_steamui btn_medium">
                                <span>${L(__cancel)}</span>
                            </div>
                        </div>
                    </div>
                </div>`;

        document.querySelector("#register_btn")!.addEventListener("click", e => {
            if (document.querySelector<HTMLInputElement>("#product_key")!.value.indexOf(",") > 0) {
                e.preventDefault();
                this._showDialog();
            }
        });

        // Show note input modal
        document.addEventListener("click", e => {
            if (!(<HTMLElement>e.target).closest("#es_activate_multiple")) { return; }
            this._showDialog();
        });

        // Insert the "activate multiple products" button
        HTML.beforeBegin("#registerkey_examples_text",
            `<a class="btnv6_blue_hoverfade btn_medium" id="es_activate_multiple" style="margin-bottom: 15px;">
                <span>${L(__activateMultiple)}</span>
            </a>
            <div style="clear: both;"></div>`);

        // Process activation

        document.addEventListener("click", (e) => {
            if (!(<HTMLElement>e.target).closest(".es_activate_modal_submit")) { return; }

            document.querySelector<HTMLElement>(".es_activate_modal_submit")!.style.display = "none";
            document.querySelector<HTMLElement>(".es_activate_modal_close")!.style.display = "none";

            const keys: string[] = [];

            // turn textbox into table to display results
            const lines = document.querySelector<HTMLInputElement>("#es_key_input")!.value.split("\n");
            const node = document.querySelector<HTMLElement>("#es_activate_input_text")!;
            HTML.beforeBegin(node, "<div id='es_activate_results'></div>");
            node.style.display = "none";

            lines.forEach(line => {
                let attempt = String(line);

                // remove all whitespace and non-key characters
                attempt = attempt.replace(/[^0-9A-Za-z]/g, "");

                if (attempt === "") { // skip blank rows in the input dialog (including trailing newline)
                    return;
                }
                keys.push(attempt);

                const url = ExtensionResources.getURL("img/questionmark.png");

                HTML.beforeEnd("#es_activate_results",
                    `<div style='margin-bottom: 8px;'><span id='attempt_${attempt}_icon'><img src='${url}' style='padding-right: 10px; height: 16px;'></span>${attempt}</div><div id='attempt_${attempt}_result' style='margin-left: 26px; margin-bottom: 10px; margin-top: -5px;'></div>`);
            });

            // force recalculation of the modal's position, so it doesn't extend off the bottom of the page
            TimeUtils.timer(250).then(() => {
                window.dispatchEvent(new Event("resize"));
            });

            // attempt to activate each key in sequence
            const promises = [];

            for (let i = 0; i < keys.length; i++) {
                const currentKey = keys[i]!;

                const data = {
                    sessionid: this.context.user.sessionId!,
                    product_key: currentKey
                };

                promises.push((async function() {
                    try {
                        const response = await RequestData.post("https://store.steampowered.com/account/ajaxregisterkey", data);
                        const result = await response.json() as {
                            success: number,
                            purchase_result_details: number,
                            purchase_receipt_info: {
                                line_items: Array<{
                                    line_item_description: string
                                }>,
                            }
                        };

                        const attempted = currentKey;
                        let message = L(__register_default);
                        if (result.success === 1) {
                            document.querySelector(`#attempt_${attempted}_icon img`)!.setAttribute("src", ExtensionResources.getURL("img/sr/okay.png"));
                            if (result.purchase_receipt_info.line_items.length > 0) {
                                document.querySelector(`#attempt_${attempted}_result`)!.textContent = L(__register_success, {
                                    "gamename": result.purchase_receipt_info.line_items[0]!.line_item_description
                                });
                                document.querySelector<HTMLElement>(`#attempt_${attempted}_result`)!.style.display = "block";
                            }
                        } else {
                            switch (result.purchase_result_details) {
                                case 9: message = L(__register_owned); break;
                                case 13: message = L(__register_notavail); break;
                                case 14: message = L(__register_invalid); break;
                                case 15: message = L(__register_already); break;
                                case 24: message = L(__register_dlc); break;
                                case 50: message = L(__register_wallet); break;
                                case 53: message = L(__register_toomany); break;
                            }
                            document.querySelector<HTMLElement>(`#attempt_${attempted}_icon img`)!.setAttribute("src", ExtensionResources.getURL("img/sr/banned.png"));
                            document.querySelector<HTMLElement>(`#attempt_${attempted}_result`)!.textContent = message;
                            document.querySelector<HTMLElement>(`#attempt_${attempted}_result`)!.style.display = "block";
                        }

                    } catch (e) {
                        const attempted = currentKey;
                        document.querySelector<HTMLElement>(`#attempt_${attempted}_icon img`)!.setAttribute("src", ExtensionResources.getURL("img/sr/banned.png"));
                        document.querySelector<HTMLElement>(`#attempt_${attempted}_result`)!.textContent = L(__error);
                        document.querySelector<HTMLElement>(`#attempt_${attempted}_result`)!.style.display = "block";
                    }
                })());
            }

            Promise.all(promises).then(() => {
                document.querySelector<HTMLElement>(".es_activate_modal_close span")!.textContent = L(__close);
                document.querySelector<HTMLElement>(".es_activate_modal_close")!.style.display = "block";
                window.dispatchEvent(new Event("resize"));
            });
        });

        // Bind the "Cancel" button to close the modal
        document.addEventListener("click", ({target}) => {
            if (!(<HTMLElement>target).closest(".es_activate_modal_close")) { return; }
            SteamFacade.dismissActiveModal();
        });
    }

    private _showDialog(): void {
        SteamFacade.showDialog(
            L(__activateMultipleHeader),
            this._template.replace(
                "__alreadyentered__",
                document.querySelector<HTMLInputElement>("#product_key")!.value.replace(/,/g, "\n")
            ),
        );
    }
}
