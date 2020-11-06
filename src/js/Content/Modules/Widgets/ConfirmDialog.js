import {Page} from "../../Features/Page";

class ConfirmDialog {

    static open(strTitle, strDescription, strOKButton, strCancelButton, strSecondaryActionButton) {
        return Page.runInPageContext((a, b, c, d, e) => {
            const prompt = window.SteamFacade.showConfirmDialog(a, b, c, d, e);

            return new Promise((resolve) => {
                prompt.done(result => {
                    resolve(result);
                }).fail(() => {
                    resolve("CANCEL");
                });
            });
        },
        [
            strTitle,
            strDescription,
            strOKButton,
            strCancelButton,
            strSecondaryActionButton
        ],
        true);
    }
}

export {ConfirmDialog};
