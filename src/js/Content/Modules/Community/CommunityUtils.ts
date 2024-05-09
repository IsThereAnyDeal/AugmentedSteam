import User from "../User";

export class CommunityUtils {

    static currentUserIsOwner(): boolean {
        if (!User.isSignedIn) {
            return false;
        }

        const profileLinkNode = document.querySelector<HTMLAnchorElement>(".profile_small_header_texture > a, .friends_header_avatar > a");
        if (!profileLinkNode) {
            return false;
        }

        let profileLink = profileLinkNode.href
        if (!profileLink.endsWith("/")) {
            profileLink += "/";
        }

        return profileLink === User.profileUrl;
    }

    static makeProfileLink(id: string, link: string, name: string, iconType: string, iconUrl: string): string {
        const mainType = iconUrl ? "none" : iconType;
        let html = `<div class="es_profile_link profile_count_link">
                    <a class="es_sites_icons es_${id}_icon es_${mainType}" href="${link}" target="_blank">`;

        if (iconType !== "none" && iconUrl) {
            html += `<i class="es_sites_custom_icon es_${iconType}" style="background-image: url('${iconUrl}');"></i>`;
        }

        html += `<span class="count_link_label">${name}</span>
                 <span class="profile_count_link_total">&nbsp;</span></a></div>`; // Steam spacing

        return html;
    }
}
