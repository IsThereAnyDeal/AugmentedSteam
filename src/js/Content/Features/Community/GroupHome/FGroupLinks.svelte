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
