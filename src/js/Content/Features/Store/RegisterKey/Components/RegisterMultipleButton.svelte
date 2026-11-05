<script lang="ts">
    import {__activateMultiple} from "@Strings/_strings";
    import {L} from "@Core/Localization/Localization";
    import MultiProductKeysForm from "@Content/Features/Store/RegisterKey/Components/MultiProductKeysForm.svelte";
    import type UserInterface from "@Core/User/UserInterface";
    import {mount, unmount} from "svelte";
    import LargeSteamButton from "@Content/Steam/LargeSteamButton.svelte";

    interface Props {
        user: UserInterface;
    }

    let { user }: Props = $props();

    function showDialog(): void {
        const value = document.querySelector<HTMLInputElement>("#product_key")!.value.replace(/,/g, "\n");
        const dialog = mount(MultiProductKeysForm, {
            target: document.body,
            props: {
                user,
                value,
                oncancel: () => unmount(dialog)
            }
        });
    }
</script>


<div>
    <LargeSteamButton onclick={showDialog}>{L(__activateMultiple)}</LargeSteamButton>
</div>


<style>
    div {
        margin: 5px 0 15px 0;
    }
</style>