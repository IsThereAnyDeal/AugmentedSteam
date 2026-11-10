<script lang="ts">
    import {L} from "@Core/Localization/Localization";
    import {__earlyAccess} from "@Strings/_strings";
    import type Language from "@Core/Localization/Language";
    import ExtensionResources from "@Core/ExtensionResources";

    interface Props {
        language: Language|null
    }

    let { language }: Props = $props();

    const imageUrl = $derived.by(() => {
        // TODO add missing images for supported locales
        const languageName = language?.isOneOf(
            "brazilian",
            "french",
            "italian",
            "japanese",
            "koreana",
            "polish",
            "portuguese",
            "russian",
            "schinese",
            "spanish",
            "latam",
            "tchinese",
            "thai"
        ) ? language.name : "english";

        return ExtensionResources.getURL(`img/overlay/early_access_banner_${languageName}.png`)
    });
</script>


<img title={L(__earlyAccess)} src={imageUrl} alt="Early Access banner">
