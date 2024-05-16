(function(){
    const oldShowNicknameModal = window.ShowNicknameModal;

    // Show current nickname in input box
    window.ShowNicknameModal = function() {
        oldShowNicknameModal();

        const nicknameNode = document.querySelector(".persona_name .nickname");
        if (nicknameNode !== null) {
            document.querySelector(".newmodal input[type=text]").value = nicknameNode.textContent.trim().slice(1, -1);
        }
    };

    document.querySelector("#es_nickname")?.addEventListener("click", () => {
        window.ShowNicknameModal();
        window.HideMenu("profile_action_dropdown_link", "profile_action_dropdown");
    });
})();
