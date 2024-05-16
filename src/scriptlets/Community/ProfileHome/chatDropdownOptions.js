(function() {
    const params = JSON.parse(document.currentScript.dataset.params);
    const friendSteamId = params.friendSteamId;

    document.querySelector("#btnWebChat").addEventListener("click", () => {
        OpenFriendChatInWebChat(friendSteamId);
    });

    document.querySelector("#profile_chat_dropdown_link").addEventListener("click", () => {
        ShowMenu("profile_chat_dropdown_link", "profile_chat_dropdown", "right");
    });

    document.querySelector("#profile_chat_dropdown").addEventListener("click", () => {
        HideMenu("profile_chat_dropdown_link", "profile_chat_dropdown");
    });
})();
