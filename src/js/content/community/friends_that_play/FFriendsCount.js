import {Feature} from "modules";

import {HTML} from "core";

export default class FFriendsCount extends Feature {

    apply() {
        for (const header of document.querySelectorAll(".friendListSectionHeader")) {
            const profileList = header.nextElementSibling;
            const count = profileList.querySelectorAll(".persona").length;
            const html = ` <span class='friendcount'>(${count})</span> `;
            const underscore = header.querySelector(".underscoreColor");

            if (underscore) {
                HTML.beforeBegin(underscore, html);
            } else {
                HTML.beforeEnd(header, html);
            }
        }
    }
}
