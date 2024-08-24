<script lang="ts">
    import ProfileLinkIcon from "../../Icons/ProfileLinkIcon.svelte";

    export let id: string;
</script>


<span class="link">
    <ProfileLinkIcon {id} iconType="color" /><slot></slot>
</span>


<style>
    .link {
        display: inline-flex;
        align-items: center;
    }
</style>
