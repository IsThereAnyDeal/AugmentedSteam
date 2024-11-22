<script lang="ts">
    import {L} from "@Core/Localization/Localization";
    import {__loginWarning} from "@Strings/_strings";
    import Warning from "@Content/Modules/Widgets/AugmentedSteam/Components/Warning.svelte";
    import LocalStorage from "@Core/Storage/LocalStorage";
    import {createEventDispatcher} from "svelte";

    const dispatch = createEventDispatcher<{
        close: void
    }>();

    export let react: boolean;
    export let page: "store"|"community";

    let host: string;
    $: switch(page) {
          case "store": host = "store.steampowered.com"; break;
          case "community": host = "steamcommunity.com"; break;
          default: throw new Error();
      }

    function handleClose(): void {
        if (page === "store") {
            LocalStorage.set(`hide_login_warn_store`, true);
        } else if (page === "community") {
            LocalStorage.set(`hide_login_warn_community`, true);
        }
        dispatch("close");
    }
</script>


<Warning {react} on:close={handleClose} on:hide={() => dispatch("close")}>
    {@html L(__loginWarning, {"link": `<a href="https://${host}/login/">${host}</a>`})}
</Warning>


