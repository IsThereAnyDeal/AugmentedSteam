import {__featureHint_desc, __featureHint_reminder, __thewordno, __thewordyes} from "../../../../localization/compiled/_strings";
import {L} from "../../../Core/Localization/Localization";
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

    static openFeatureHint(optionStr, strTitle, strDescription, strOKButton, strCancelButton, strSecondaryActionButton) {

        const _strTitle = strTitle ? `Augmented Steam - ${strTitle}` : "Augmented Steam";

        const _strDescription = `${strDescription ? `${strDescription}<br><br>` : ""}
            ${L(__featureHint_desc)}<br><br>
            <span class="as_feature_hint_option">${L(optionStr)}</span><br><br>
            ${L(__featureHint_reminder)}`;

        const _strOKButton = strOKButton || L(__thewordyes);
        const _strCancelButton = strCancelButton || L(__thewordno);

        return this.open(_strTitle, _strDescription, _strOKButton, _strCancelButton, strSecondaryActionButton);
    }
}

export {ConfirmDialog};
