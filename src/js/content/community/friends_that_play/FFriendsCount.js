import {Feature} from "modules";

import {HTML} from "core";

export class FFriendsCount extends Feature {

    apply() {
        for (let header of document.querySelectorAll(".friendListSectionHeader")) {
            let profileList = header.nextElementSibling;
            let count = profileList.querySelectorAll('.persona').length;
            let html = ` <span class='friendcount'>(${count})</span> `;
            let underscore = header.querySelector('.underscoreColor');

            if (underscore) {
                HTML.beforeBegin(underscore, html);
            } else {
                HTML.beforeEnd(header, html);
            }
        }
    }
}
