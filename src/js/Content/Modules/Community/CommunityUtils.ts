import User from "../User";

export default class CommunityUtils {

    static currentUserIsOwner(): boolean {
        if (!User.isSignedIn) {
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

        return profileLink === User.profileUrl;
    }
}
