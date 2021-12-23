import {Page} from "../../Features/Page";
import {Localization} from "../../../Core/Localization/Localization";

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

    static openFeatureHint(optionStr) {
        return this.open(
            "Augmented Steam",
            `${Localization.str.feature_hint.desc}<br><br>${optionStr}<br><br>${Localization.str.feature_hint.reminder}`,
            Localization.str.thewordyes,
            Localization.str.thewordno
        );
    }
}

export {ConfirmDialog};
