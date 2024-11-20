import type UserInterface from "@Core/User/UserInterface";

export default class CommunityUtils {

    static userIsOwner(user: UserInterface): boolean {
        if (!user.isSignedIn) {
            return false;
        }

        const profileLinkNode = document.querySelector<HTMLAnchorElement>(".profile_small_header_texture > a, .friends_header_avatar > a");
        if (!profileLinkNode) {
            return false;
        }

        let profileLink = profileLinkNode.href;
        if (!profileLink.endsWith("/")) {
            profileLink += "/";
        }

        return profileLink === user.profileUrl;
    }
}
