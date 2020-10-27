
export class ConfirmDialog {

    static open(strTitle, strDescription, strOKButton, strCancelButton, strSecondaryActionButton) {
        return ExtensionLayer.runInPageContext((a, b, c, d, e) => {
                // eslint-disable-next-line no-undef, new-cap
                const prompt = ShowConfirmDialog(a, b, c, d, e);

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
