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


<style>
    /* Taken from: https://store.cloudflare.steamstatic.com/public/css/v6/home.css */
    #es_customize_btn {
        text-align: left;
    }
    #es_customize_btn .es_customize_title {
        display: inline-block;
        padding-right: 3px;
        padding-left: 8px;
        margin: 0 1px;
        line-height: 20px;
        text-align: center;
        font-size: 11px;
        cursor: pointer;
        color: #ffffff;
        text-transform: uppercase;
    }
    #es_customize_btn .es_customize_title img {
        vertical-align: text-bottom;
    }
    #es_customize_btn:hover .es_customize_title {
        text-decoration: none;
        color: #111111;
        border-radius: 1px;
        background: linear-gradient(135deg, #ffffff 0%, #919aa3 100%);
    }
    #es_customize_btn .home_viewsettings_popup {
        position: absolute;
        color: #384959;
        padding: 12px 11px;
        width: 200px;
        z-index: 10;
        box-shadow: 0 0 12px #000000;
        background: linear-gradient(to bottom, #e3eaef 5%, #c7d5e0 95%);
        right: 0px;
        opacity: 0;
        visibility: hidden;
        transition: visibility 0s 0.2s, opacity 0.2s ease-in-out;
    }
    #es_customize_btn.active .home_viewsettings_popup {
        opacity: 1;
        visibility: visible;
        transition: visibility, opacity 0.2s ease-in-out;
    }
    #es_customize_btn .home_viewsettings_instructions {
        margin-bottom: 12px;
        font-size: 12px;
    }
    #es_customize_btn .home_viewsettings_checkboxrow {
        background: rgba(0, 0, 0, 0.2);
        margin-bottom: 1px;
        padding: 2px;
        line-height: 14px;
        color: #222d3d;
        font-size: 10px;
        cursor: pointer;
    }
    #es_customize_btn .home_viewsettings_checkboxrow:hover {
        color: #ffffff;
        background: rgba(0, 0, 0, 0.3);
    }
    #es_customize_btn .home_viewsettings_checkbox {
        float: left;
        margin-right: 5px;
        display: block;
        width: 14px;
        height: 14px;
        background-image: url('https://store.cloudflare.steamstatic.com/public/images/v6/customize_checkboxes.png');
        background-position: 0px 0px;
    }
    #es_customize_btn .home_viewsettings_checkbox.checked {
        background-position: 0px 28px;
    }
    #es_customize_btn .home_viewsettings_label {
        text-transform: capitalize;
    }
</style>
