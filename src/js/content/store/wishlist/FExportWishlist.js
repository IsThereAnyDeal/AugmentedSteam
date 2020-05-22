class FExportWishlist extends ASFeature {

    apply() {
        HTML.afterBegin("#cart_status_data", `<div class="es-wbtn" id="es_export_wishlist"><div>${Localization.str.export.wishlist}</div></div>`);

        document.querySelector("#es_export_wishlist").addEventListener("click", async () => {

            let [appInfo, apps] = await ExtensionLayer.runInPageContext(() => [g_rgAppInfo, g_Wishlist.rgAllApps], null, true); 

            this._showDialog(appInfo, apps);
        });
    }

    /**
     * Using Valve's CModal API here is very hard, since, when trying to copy data to the clipboard, it has to originate from
     * a short-lived event handler for a user action.
     * Since we'd use our Messenger class to pass information in between these two contexts, we would "outrange" this specific event
     * handler, resulting in a denial of access to the clipboard function.
     * This could be circumvented by adding the appropriate permissions, but doing so would prompt users to explicitly accept the changed
     * permissions on an update.
     *
     * If we don't use the Messenger, we'd have to move the whole handler part (including WishlistExporter) to
     * the page context side.
     *
     * Final solution is to query the action buttons of the dialog and adding some extra click handlers on the content script side.
     */
    _showDialog(appInfo, apps) {

        function exportWishlist(method) {
            let type = document.querySelector("input[name='es_wexport_type']:checked").value;
            let format = document.querySelector("#es-wexport-format").value;

            let wishlist = new WishlistExporter(appInfo, apps);

            let result = "";
            let filename = "";
            let filetype = "";
            if (type === "json") {
                result = wishlist.toJson();
                filename = "wishlist.json";
                filetype = "application/json";
            } else if (type === "text" && format) {
                result = wishlist.toText(format);
                filename = "wishlist.txt";
                filetype = "text/plain";
            }

            if (method === WishlistExporter.method.copyToClipboard) {
                Clipboard.set(result);
            } else if (method === WishlistExporter.method.download) {
                Downloader.download(new Blob([result], { type: `${filetype};charset=UTF-8` }), filename);
            }
        }

        ExtensionLayer.runInPageContext(exportStr => {
            ShowConfirmDialog(
                exportStr.wishlist,
                `<div id='es_export_form'>
                    <div class="es-wexport">
                    <h2>${exportStr.type}</h2>
                    <div>
                        <label class="es-wexport__label"><input type="radio" name="es_wexport_type" value="text" checked> ${exportStr.text}</label>
                        <label class="es-wexport__label"><input type="radio" name="es_wexport_type" value="json"> JSON</label>
                    </div>
                    </div>

                    <div class="es-wexport es-wexport__format">
                        <h2>${exportStr.format}</h2>
                        <div>
                            <input type="text" id="es-wexport-format" class="es-wexport__input" value="%title%"><br>
                            <div class="es-wexport__symbols">%title%, %id%, %appid%, %url%, %release_date%, %price%, %discount%, %base_price%, %type%, %note%</div>
                        </div>
                    </div>
                </div>`,
                exportStr.download,
                null, // use default "Cancel"
                exportStr.copy_clipboard
            );
        }, [ Localization.str.export ]);

        let [ dlBtn, copyBtn ] = document.querySelectorAll(".newmodal_buttons > .btn_medium");

        dlBtn.classList.remove("btn_green_white_innerfade");
        dlBtn.classList.add("btn_darkblue_white_innerfade");

        // Capture this s.t. the CModal doesn't get destroyed before we can grab this information
        dlBtn.addEventListener("click", () => { exportWishlist(WishlistExporter.method.download) }, true);
        copyBtn.addEventListener("click", () => { exportWishlist(WishlistExporter.method.copyToClipboard) }, true);

        let format = document.querySelector(".es-wexport__format");
        for (let el of document.getElementsByName("es_wexport_type")) {
            el.addEventListener("click", e => format.style.display = e.target.value === "json" ? "none" : "");
        }
    }
}