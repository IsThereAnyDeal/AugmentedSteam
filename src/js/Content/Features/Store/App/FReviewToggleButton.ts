import self_ from "./FReviewToggleButton.svelte";
import type CApp from "@Content/Features/Store/App/CApp";
import Feature from "@Content/Modules/Context/Feature";

/**
 * Adds button that shows/hides "Write a review" form on app pages,
 * last state of the form is remembered across app pages
 */
export default class FReviewToggleButton extends Feature<CApp> {
    private node: HTMLElement|null = null;

    override checkPrerequisites(): boolean {
        this.node = document.getElementById("review_create");
        return this.node !== null;
    }

    override apply(): void {
        const target = this.node!.querySelector("h1");
        if (!target) {
            throw new Error("Node not found");
        }

        // Reparent review section nodes
        const reviewSection = document.createElement("div");
        reviewSection.classList.add("es_review_section");
        reviewSection.append(
            ...this.node!.querySelectorAll("p, .avatar_block, .content")
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
