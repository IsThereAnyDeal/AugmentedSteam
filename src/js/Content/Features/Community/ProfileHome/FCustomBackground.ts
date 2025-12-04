import type CProfileHome from "@Content/Features/Community/ProfileHome/CProfileHome";
import Feature from "@Content/Modules/Context/Feature";
import HTML from "@Core/Html/Html";

export default class FCustomBackground extends Feature<CProfileHome> {

    private _bg: string = "";

    override async checkPrerequisites(): Promise<boolean> {

        if (window.location.hash.startsWith("#previewBackground")) {
            let hash: RegExpMatchArray|null = window.location.hash.match(/#previewBackground\/(\d+)\/([a-z0-9.]+)/i);
            let preview: string|null = null;
            if (hash) {
                preview = `https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/items/${hash[1]}/${hash[2]}`;
            } else {
                hash = window.location.hash.match(/#previewBackground\/(economy\/image\/.+)/);
                if (hash) {
                    preview = `https://community.fastly.steamstatic.com/${hash[1]}`;
                }
            }

            if (preview) {
                this._setProfileBg(preview);
                return false;
            }
        }

        if (this.context.isPrivateProfile) {
            return false;
        }

        const result = await this.context.data;
        if (!result || !result.bg || !result.bg.img) {
            return false;
        }

        this._bg = `https://steamcommunity.com/economy/image/${result.bg.img}`;
        return true;
    }

    override apply(): void {
        this._setProfileBg(this._bg);
    }

    _setProfileBg(src: string) {

        const isVideo = /(webm|mp4)$/.test(src);
        const profilePage = document.querySelector<HTMLElement>(".no_header.profile_page");
        const animatedBgContainer = document.querySelector<HTMLElement>(".profile_animated_background");

        if (!profilePage) {
            return;
        }

        if (isVideo) {
            if (animatedBgContainer) {
                animatedBgContainer.querySelector<HTMLVideoElement>("video")!.src = src;
            } else {
                HTML.afterBegin(profilePage,
                    `<div class="profile_animated_background">
                        <video playsinline autoplay muted loop src="${src}"></video>
                    </div>`);

                profilePage.style.backgroundImage = "none";
            }
        } else {
            if (animatedBgContainer) {
                animatedBgContainer.remove(); // Animated BGs will interfere with static BGs
            }

            profilePage.style.backgroundImage = `url(${src})`;
        }

        if (!profilePage.classList.contains("has_profile_background")) {
            for (const node of [document.body, profilePage, profilePage.querySelector<HTMLElement>(".profile_content")]) {
                node?.classList.add("has_profile_background");
            }
        }
    }
}
