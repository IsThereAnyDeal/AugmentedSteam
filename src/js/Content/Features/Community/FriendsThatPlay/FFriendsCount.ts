import HTML from "@Core/Html/Html";
import Feature from "@Content/Modules/Context/Feature";
import type CFriendsThatPlay from "@Content/Features/Community/FriendsThatPlay/CFriendsThatPlay";

export default class FFriendsCount extends Feature<CFriendsThatPlay> {

    override apply(): void {

        for (const header of document.querySelectorAll(".friendListSectionHeader")) {
            const profileList = header.nextElementSibling;
            if (!profileList) { continue; }
            const count = profileList.querySelectorAll(".persona").length;
            const html = `<span class="friendcount"> (${count}) </span>`;
            const underscore = header.querySelector(".underscoreColor");

            if (underscore) {
                HTML.beforeBegin(underscore, html);
            } else {
                HTML.beforeEnd(header, html);
            }
        }
    }
}
