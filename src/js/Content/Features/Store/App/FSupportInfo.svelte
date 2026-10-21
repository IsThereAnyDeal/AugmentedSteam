<script lang="ts">
import {L} from "@Core/Localization/Localization";
    import {__email, __getHelp, __support, __website} from "@Strings/_strings";
    import HTML from "@Core/Html/Html";

    interface Props {
        appid: number,
        url: string|null,
        email: string|null
    }

    let { appid, url, email }: Props = $props();

    const mailto: string|null = $derived.by(() => {
        if (email) {
            const emailStr = email.replace("＠", "@"); // https://store.steampowered.com/app/2905790/PROJECT_TACHYON/

            // From https://emailregex.com/
            const emailRegex
                = /(?:(?:[^<>()[\]\\.,;:\s@"]+(?:\.[^<>()[\]\\.,;:\s@"]+)*)|(?:".+"))@(?:(?:\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(?:(?:[a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/g;

            const m = [...emailStr.matchAll(emailRegex)];
            if (m.length > 0) {
                return m.join(";");
            }
        }
        return null;
    });
</script>


<div class="release_date">
    <div class="subtitle column">{L(__support)}:</div>
    <div class="summary column">
        {#if url}
            <a href={HTML.formatUrl(url)}>{L(__website)}</a>,
        {/if}
        {#if mailto && email}
            <a href="mailto:{mailto}">{L(__email)}</a>,
        {/if}

        <a href="https://help.steampowered.com/wizard/HelpWithGameTechnicalIssue?appid={appid}">{L(__getHelp)}</a>
    </div>
</div>


<style>
    .release_date {
        padding-bottom: 0;
    }
</style>