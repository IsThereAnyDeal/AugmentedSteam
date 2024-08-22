
(function() {
    class Steam {

        // variables

        static global(name) {
            return window[name];
        }

        static globalSet(name, value) {
            window[name] = value;
        }

        // dialogs

        static showDialog(strTitle, strDescription, rgModalParams) {
            ShowDialog(strTitle, strDescription, rgModalParams);
        }

        static showConfirmDialog(strTitle, strDescription, strOKButton, strCancelButton, strSecondaryActionButton) {
            return new Promise(resolve => {
                ShowConfirmDialog(strTitle, strDescription, strOKButton, strCancelButton, strSecondaryActionButton)
                    .done(result => resolve(result)) // "OK" / "SECONDARY"
                    .fail(() => resolve("CANCEL"));
            })
        }

        static showAlertDialog(strTitle, strDescription, strOKButton) {
            return new Promise(resolve => {
                ShowAlertDialog(strTitle, strDescription, strOKButton)
                    .done(result => resolve())
                    .fail(() => resolve());
            })
        }

        static showBlockingWaitDialog(strTitle, strDescription) {
            return new Promise(resolve => {
                ShowBlockingWaitDialog(strTitle, strDescription);
                resolve();
            });
        }

        static dismissActiveModal() {
            CModal.DismissActiveModal();
        }

        // menu

        static showMenu(elemLink, elemPopup, align, valign, bLinkHasBorder) {
            ShowMenu(elemLink, elemPopup, align, valign, bLinkHasBorder);
        }

        static hideMenu(elemLink, elemPopup) {
            HideMenu(elemLink, elemPopup);
        }

        static changeLanguage(strTargetLanguage, bStayOnPage) {
            ChangeLanguage(strTargetLanguage, bStayOnPage);
        }

        // app pages

        static collapseLongStrings(selector) {
            CollapseLongStrings(selector);
        }

        static removeFromWishlist(appid, divToHide, divToShowSuccess, divToShowError, navref, divToHide2) {
            RemoveFromWishlist(appid, divToHide, divToShowSuccess, divToShowError, navref, divToHide2);
        }

        static addToWishlist(appid, divToHide, divToShowSuccess, divToShowError, navref, divToHide2) {
            AddToWishlist(appid, divToHide, divToShowSuccess, divToShowError, navref, divToHide2);
        }

        // events

        static bindAutoFlyoutEvents() {
            BindAutoFlyoutEvents();
        }

        // tooltips

        static vTooltip(selector, isHtml = false) {
            const isStore = window.location.host === "store.steampowered.com";

            $J(selector).v_tooltip({
                "tooltipClass": isStore ? "store_tooltip" : "community_tooltip",
                "dataAttr": isHtml ? "data-tooltip-html" : "data-tooltip-text",
                "defaultType": isHtml ? "html" : "text",
                "replaceExisting": true
            });
        }

        // market

        static calculateFeeAmount(amount, publisherFee) {
            return CalculateFeeAmount(amount, publisherFee);
        }

        static vCurrencyFormat(amount, currencyCode) {
            return v_currencyformat(amount, currencyCode);
        }

        // profile home

        static openFriendChatInWebChat(steamid, accountid) {
            OpenFriendChatInWebChat(steamid, accountid);
        }
    }

    document.addEventListener("as_SteamFacade", async function(e) {
        const {action, params, id} = e.detail;
        if (!action || !Steam[action]) {
            return;
        }

        const result = Steam[action](...params);

        if (id) {
            document.dispatchEvent(new CustomEvent(id, {
                // Remove un-structuredClone-able properties, otherwise this will return `null`
                detail: JSON.parse(JSON.stringify((await result) ?? null))
            }));
        }
    });

    window.SteamFacade = Steam;
})();
