(function(){
    const params = JSON.parse(document.currentScript.dataset.params);
    const {title, template, strSave, strCancel, appid} = params;

    const deferred = new jQuery.Deferred();
    function fnOk() {
        deferred.resolve(
            document.querySelector("#es_note_input").value
                .trim()
                .replace(/\s\s+/g, " ")
        );
    }

    function fnCancel() {
        deferred.reject();
    }

    const buttons = [];

    const okBtn = _BuildDialogButton(strSave, true);
    okBtn.click(fnOk);
    buttons.push(okBtn);

    const cancelBtn = _BuildDialogButton(strCancel, false);
    cancelBtn.click(fnCancel);
    buttons.push(cancelBtn);

    const modal = _BuildDialog(title, template, buttons, fnCancel);

    _BindOnEnterKeyPressForDialog(modal, deferred, fnOk);
    deferred.always(() => modal.Dismiss());

    const noteInput = document.getElementById("es_note_input");
    noteInput.focus();
    noteInput.setSelectionRange(0, noteInput.textLength);

    /**
     * Native keyup handler ignores events on <textarea>s
     * https://github.com/SteamDatabase/SteamTracking/blob/6aabc1d81478c9a3f33598cd0968b5fdaf14f8b8/steamcommunity.com/public/shared/javascript/shared_global.js#L477
     */
    noteInput.addEventListener("keydown", e => {
        if (e.key === "Enter" && !e.shiftKey) {
            okBtn.trigger("click");
        }
    });

    deferred.promise(modal);

    modal
        .done(note => {
            window.sessionStorage.removeItem(`es_note_autosave_${appid}`);

            document.dispatchEvent(new CustomEvent("noteClosed", {detail: {note}}));
        })
        .fail(() => {
            if (noteInput.value.trim() !== "") {
                window.sessionStorage.setItem(`es_note_autosave_${appid}`, noteInput.value);
            }
            document.dispatchEvent(new CustomEvent("noteClosed", {detail: {note: null}}));
        });

    modal.Show();
})();
