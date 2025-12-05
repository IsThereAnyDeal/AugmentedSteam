<script lang="ts">
    import {__activateMultiple} from "@Strings/_strings";
    import {L} from "@Core/Localization/Localization";
    import MultiProductKeysForm from "@Content/Features/Store/RegisterKey/Components/MultiProductKeysForm.svelte";
    import type UserInterface from "@Core/User/UserInterface";
import { mount, unmount } from "svelte";

    interface Props {
        user: UserInterface;
    }

    let { user }: Props = $props();

    function showDialog(): void {
        const dialog = mount(MultiProductKeysForm, {
                    target: document.body,
                    props: {
                        user,
                        value: document.querySelector<HTMLInputElement>("#product_key")!.value.replace(/,/g, "\n"),
                        onclose: () => unmount(dialog)
                    }
                });
    }
</script>


<button type="button" class="btnv6_blue_hoverfade btn_medium" onclick={showDialog}>
    <span>{L(__activateMultiple)}</span>
</button>
<div style="clear: both;"></div>


<style>
    button {
        margin-bottom: 15px;
    }
</style>