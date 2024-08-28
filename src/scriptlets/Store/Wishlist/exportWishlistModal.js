(function(){
    const params = JSON.parse(document.currentScript.dataset.params);
    const {title, template, strSave, strCancel, strSaveSecondary, ExportMethod} = params;

    const deferred = new jQuery.Deferred();

    function fnSelect(method) {
        deferred.resolve({
            method,
            type: document.querySelector('input[name="es_wexport_type"]:checked').value,
            format: document.querySelector("#es-wexport-format").value
        });
    }

    function fnCancel() {
        deferred.reject();
    }

    const buttons = [];

    const okBtn = _BuildDialogButton(strSave, true);
    okBtn.click(() => fnSelect(ExportMethod.download));
    buttons.push(okBtn);

    const secondaryBtn = _BuildDialogButton(strSaveSecondary, false, {strClassName: "btn_blue_steamui btn_medium"});
    secondaryBtn.click(() => fnSelect(ExportMethod.copy));
    buttons.push(secondaryBtn);

    const cancelBtn = _BuildDialogButton(strCancel, false);
    cancelBtn.click(fnCancel);
    buttons.push(cancelBtn);

    const modal = _BuildDialog(title, template, buttons, fnCancel);

    deferred.always(() => modal.Dismiss());

    // Gray-out formats when "JSON" is selected
    const format = document.querySelector(".es-wexport__format");
    for (const el of document.getElementsByName("es_wexport_type")) {
        el.addEventListener("click", ({target}) => {
            format.classList.toggle("es-grayout", target.value === "json");
        });
    }

    deferred.promise(modal);

    modal.done(value => {
        document.dispatchEvent(new CustomEvent("as_exportWishlist", {detail: value}));
    });

    modal.Show();
})();
