<script lang="ts" context="module">
    // @ts-ignore
    import self_ from "./FReviewToggleButton.svelte";
    import {Feature} from "../../../modulesContent";
    import type {CApp} from "./CApp";

    export class FReviewToggleButton extends Feature<CApp> {
        private node: Element|null = null;

        override checkPrerequisites(): boolean {
            this.node = document.getElementById("review_create");
            return this.node !== null;
        }

        override apply(): void {
            const target = this.node.querySelector("h1");
            if (!target) {
                throw new Error("Node not found");
            }

            // Reparent review section nodes
            const reviewSection = document.createElement("div");
            reviewSection.classList.add("es_review_section");
            reviewSection.append(
                ...this.node.querySelectorAll("p, .avatar_block, .content")
            );

            target.after(reviewSection);

            (new self_({
                target,
                props: {
                    reviewSection
                }
            }));
        }
    }
</script>

<script lang="ts">
    import {LocalStorage, Localization} from "../../../../modulesCore";
    import {onMount} from "svelte";

    export let reviewSection: Element|undefined;

    let show: boolean = LocalStorage.get("show_review_section");

    function toggleReviews(event?: MouseEvent) {
        if (event) {
            show = !show;
            LocalStorage.set("show_review_section", show);
        }

        reviewSection!.style.maxHeight = show ? null : 0;
    }

    onMount(() => {
        toggleReviews();
    });
</script>


<button class="btnv6_lightblue_blue btn_medium es_review_toggle" on:click={toggleReviews}>
    <div data-tooltip-text="{Localization.str.expand_slider}" class:inactive={show}>▼</div>
    <div data-tooltip-text="{Localization.str.contract_slider}" class:inactive={!show}>▲</div>
</button>


<style>
    :global(.es_review_section) {
        overflow: hidden;
    }
    .es_review_toggle {
        float: right;
        font-size: 18px;
    }
    .inactive {
        display: none;
    }
</style>
