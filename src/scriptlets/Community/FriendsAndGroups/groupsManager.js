document.addEventListener("as_GroupsManager", async function(e) {
    const {action} = e.detail;

    switch(action) {
        case "updateSelection":
            UpdateSelection();
            break;

        case "toggleManageFriends":
            ToggleManageFriends();
            break;

        case "selectAll":
            SelectAll();
            break;

        case "selectNone":
            SelectNone();
            break;

        case "selectInverse":
            SelectInverse();
            break;

    }
});
