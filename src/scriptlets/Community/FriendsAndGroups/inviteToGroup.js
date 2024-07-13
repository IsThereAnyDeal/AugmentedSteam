(function() {
    const params = JSON.parse(document.currentScript.dataset.params);
    const {groupId} = params;

    ToggleManageFriends();
    $J("#es_invite_to_group").on("click", () => {
        const friends = GetCheckedAccounts("#search_results > .selectable.selected:visible");
        InviteUserToGroup(null, groupId, friends);
    });
})();
