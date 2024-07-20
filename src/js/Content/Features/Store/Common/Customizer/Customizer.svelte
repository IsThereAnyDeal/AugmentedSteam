<svelte:options immutable={false} />

<script lang="ts">
    import {L} from "@Core/Localization/Localization";
    import {__apppageSections, __customize,} from "@Strings/_strings";
    import {onMount} from "svelte";
    import Settings from "@Options/Data/Settings";
    import type {CustomizerSetup} from "@Content/Features/Store/Common/Customizer/CustomizerSetup";

    export let type: "app"|"frontpage";
    export let setup: CustomizerSetup = [];
    export let dynamicSelector: string|undefined = undefined;

    let entries: Map<string, [string, boolean]> = new Map();
    let isActive: boolean = false;

    function getLabel(node: HTMLElement): string {
        const textNode = node.querySelector("h1, h2, .home_title, .home_section_title");
        if (!textNode) {
            return "";
        }
        let str = "";
        for (const node of textNode.childNodes) {
            if (node.nodeType === Node.TEXT_NODE) {
                str += node.textContent!.trim();
            }
        }
        return str.toLowerCase();
    }

    function toggle(name: string) {
        const entry = entries.get(name)!;
        const enabled = !entry[1];
        entry[1] = enabled;
        entries.set(name, entry);

        for (let element of document.querySelectorAll<HTMLElement>(`[data-as-customizer='${name}']`)) {
            element.classList.toggle("esi-shown", enabled);
            element.classList.toggle("esi-hidden", !enabled);
        }

        if (type === "app") {
            Settings.customize_apppage[name] = enabled;
            Settings.customize_apppage = Settings.customize_apppage;
        } else if (type === "frontpage") {
            Settings.customize_frontpage[name] = enabled;
            Settings.customize_frontpage = Settings.customize_frontpage;
        }
        entries = entries;
    }

    function init(setup: CustomizerSetup) {
        let settings: Record<string, boolean> = type === "app"
            ? Settings.customize_apppage
            : Settings.customize_frontpage;

        for (let [name, selectorOrElement, label, forceShow] of setup) {
            if (!selectorOrElement) {
                continue;
            }

            const enabled = settings[name] ?? true;
            const elements: HTMLElement[] = typeof selectorOrElement === "string"
                ? [...document.querySelectorAll<HTMLElement>(selectorOrElement)]
                : [selectorOrElement];

            for (const element of elements) {
                if (getComputedStyle(element).display === "none" && !forceShow) {
                    continue;
                }

                if (typeof label !== "string" || label === "") {
                    label = getLabel(element);
                    if (label === "") { continue; }
                }

                element.classList.toggle("esi-shown", enabled);
                element.classList.toggle("esi-hidden", !enabled);
                element.dataset['asCustomizer'] = name;
            }

            if (label) {
                entries.set(name, [label, enabled]);
            }
        }
        entries = entries;
    }

    onMount(() => {
        init(setup);

        // we need to run dynamic separately, because it checks whether [data-as-customizer] already exists in found nodes
        if (dynamicSelector) {
            let dynamic: CustomizerSetup = [];
            for (const node of document.querySelectorAll<HTMLElement>(dynamicSelector)) {
                if (node.closest("[data-as-customizer]")
                 || node.querySelector("[data-as-customizer]")
                 || node.style.display === "none"
                ) {
                    continue;
                }

                const text = getLabel(node);
                if (text === "") { return; }

                dynamic.push([`dynamic_${text}`, node]);
            }
        }
    });
</script>


<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
<div class="store_header_btn_gray store_header_btn" class:active={isActive} id="es_customize_btn"
     on:click={() => isActive = !isActive}
     on:mouseleave={() => isActive = false}
>
    <div class="es_customize_title">
        {L(__customize)}
        <img src="//store.cloudflare.steamstatic.com/public/images/v6/btn_arrow_down_padded_white.png" alt="" />
    </div>
    <div class="home_viewsettings_popup" on:click|stopPropagation>
        <div class="home_viewsettings_instructions">{L(__apppageSections)}</div>

        {#each entries.entries() as [name, entry](name)}
            {@const label = entry[0]}
            {@const enabled = entry[1]}
            <div class="home_viewsettings_checkboxrow ellipsis" on:click={() => toggle(name)}>
                <div class="home_viewsettings_checkbox" class:checked={enabled}></div>
                <div class="home_viewsettings_label">{label}</div>
            </div>
        {/each}
    </div>
</div>
