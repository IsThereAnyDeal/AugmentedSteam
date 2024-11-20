
(function() {
    class Steam {

        // variables

        static global(name) {
            const parts = name.split(".");
            let result = window;
            for (let part of parts) {
                if (typeof result[part] === "undefined") {
                    return undefined;
                }
                result = result[part];
            }
            return result;
        }

        static globalSet(name, value) {
            window[name] = value;
        }

        static globalExists(name) {
            const parts = name.split(".");
            let result = window;
            for (let part of parts) {
                if (!result[part]) {
                    return false;
                }
                result = result[part];
            }
            return true;
        }

        // dialogs

        static showDialog(strTitle, strDescription, rgModalParams) {
            ShowDialog(strTitle, strDescription, rgModalParams);
        }

        static showConfirmDialog(strTitle, strDescription, strOKButton, strCancelButton, strSecondaryActionButton, bExplicitConfirm, bExplicitDismissal) {

            let rgModalParams = {};
            if (bExplicitDismissal) {
                rgModalParams.bExplicitDismissalOnly = true;
            }

            return new Promise(resolve => {
                ShowConfirmDialog(strTitle, strDescription, strOKButton, strCancelButton, strSecondaryActionButton, rgModalParams)
                    .done(result => resolve(result)) // "OK" / "SECONDARY"
                    .fail(() => resolve("CANCEL"));

                if (bExplicitConfirm) {
                    $J(document).off("keyup.SharedConfirmDialog");
                }
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

        static dismissActiveModal(id) {
            if (id) {
                for (const modal of CModal.s_rgModalStack) {
                    if (modal.GetContent().find(`#${id}`).length > 0) {
                        modal.Dismiss();
                        break;
                    }
                }
            } else {
                CModal.DismissActiveModal();
            }
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

        // edit guide

        static submitGuide() {
            SubmitGuide();
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
