<script lang="ts" context="module">
    import self_ from "./FGroupLinks.svelte";
    import Feature from "@Content/Modules/Context/Feature";
    import Settings from "@Options/Data/Settings";
    import type CGroupHome from "@Content/Features/Community/GroupHome/CGroupHome";

    export class FGroupLinks extends Feature<CGroupHome> {

        override checkPrerequisites(): boolean | Promise<boolean> {
            return Settings.group_steamgifts;
        }

        override apply(): void {

            const anchor = document.querySelector<HTMLElement>(".responsive_hidden > .rightbox")
                ?.parentElement
                ?.nextElementSibling;
            if (anchor) {
                (new self_({
                    target: anchor.parentElement!,
                    anchor: anchor as HTMLElement,
                    props: {
                        groupId: this.context.groupId
                    }
                }));
            }
        }
    }
</script>


<script lang="ts">
    import ProfileLink from "@Content/Modules/Community/ProfileLink.svelte";

    export let groupId: string;
</script>


<div class="rightbox_header"></div>
<div class="rightbox">
    <div class="content">
        <ProfileLink id="steamgifts" href="https://www.steamgifts.com/go/group/{groupId}">SteamGifts</ProfileLink>
    </div>
</div>
<div class="rightbox_footer"></div>
