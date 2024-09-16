<svelte:options immutable={false} />

<script lang="ts">
    import {__addTag, __customTags} from "@Strings/_strings";
    import {L} from "@Core/Localization/Localization";
    import LocalStorage from "@Core/Storage/LocalStorage";
    import HTML from "@Core/Html/Html";
    import SteamFacade from "@Content/Modules/Facades/SteamFacade";
    import RequestData from "@Content/Modules/RequestData";
    import {onMount} from "svelte";
    import AddTagForm from "./Components/AddTagForm.svelte";
    import CustomModal from "@Core/Modals/CustomModal";

    let customTags: Set<string> = new Set(); // Use Set to enforce unique tags

    async function addTags(): Promise<void> {

        const params = new URLSearchParams(window.location.search);
        let tags: string[];

        // id param only appears when editing existing guides; fetch tags from guide page (add preview=true to support unpublished)
        if (params.has("id")) {
            const data = await RequestData.getText(`https://steamcommunity.com/sharedfiles/filedetails/?id=${params.get("id")}&preview=true`);
            const dom = HTML.toDom(data);
            tags = [...dom.querySelectorAll(".workshopTags > a")].map(node => node.textContent!.trim());
        } else {
            tags = (await LocalStorage.get("guide_tags")) ?? [];
        }

        for (const tag of tags) {
            const node = document.querySelector<HTMLInputElement>(`[name="tags[]"][value="${tag.replace(/"/g, '\\"')}"]`);
            if (node) {
                node.checked = true;
            } else {
                customTags.add(tag);
            }
        }
        customTags = customTags;
    }

    async function showDialog(): Promise<void> {

        let form: AddTagForm|undefined;
        let tag: string = "";

        const response = await CustomModal({
            title: L(__customTags),
            modalFn: (target) => {
                form = new AddTagForm({
                    target,
                    props: {tag}
                });
                form.$on("change", () => {
                    tag = form!.tag;
                });
                return form;
            }
        });

        if (response === "OK") {
            if (tag.trim() === "") {
                return;
            }
            tag = tag.slice(0, 1).toUpperCase() + tag.slice(1);

            customTags.add(tag);
            customTags = customTags;
        }
    }

    const submitBtn = document.querySelector("[href*=SubmitGuide]");
    if (submitBtn) {
        submitBtn.removeAttribute("href");
        submitBtn.addEventListener("click", async () => {

            const recentTags: string[] = [...document.querySelectorAll<HTMLInputElement>("[name='tags[]']:checked")]
                .map(node => node.value);

            await LocalStorage.set("guide_tags", recentTags);
            SteamFacade.submitGuide();
        });
    }

    onMount(() => {
        addTags();
    });
</script>


<div class="tag_category_container" id="checkboxgroup_2">
    <div class="tag_category_desc">{L(__customTags)}</div>
    {#each customTags as tag}
        <div>
            <input type="checkbox" name="tags[]" value="{tag}" class="inputTagsFilter" checked>
            {tag}
        </div>
    {/each}
    <!-- svelte-ignore a11y-click-events-have-key-events a11y-missing-attribute -->
    <a class="btn_blue_white_innerfade btn_small_thin as_add_tag" on:click={showDialog} role="button" tabindex="0">
        <span>{L(__addTag)}</span>
    </a>
</div>


<style>
    .as_add_tag {
        margin-top: 8px;
    }
</style>
