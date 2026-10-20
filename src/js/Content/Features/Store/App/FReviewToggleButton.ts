import self_ from "./FReviewToggleButton.svelte";
import type CApp from "@Content/Features/Store/App/CApp";
import Feature from "@Content/Modules/Context/Feature";
import { mount } from "svelte";

/**
 * Adds button that shows/hides "Write a review" form on app pages,
 * last state of the form is remembered across app pages
 */
export default class FReviewToggleButton extends Feature<CApp> {

    override async checkPrerequisites(): Promise<boolean> {
        // FIXME setting
        return true;
    }

    override async apply(): Promise<void> {
        const reviewForm = document.querySelector("#review_create");
        if (!reviewForm) {
            throw new Error("Node not found");
        }

        const target = reviewForm.querySelector("h2");
        if (!target) {
            throw new Error("Node not found");
        }
        target.style.display = "flex";
        target.style.justifyContent = "space-between";

        // Reparent review section nodes
        const reviewSection = document.createElement("div");
        reviewSection.classList.add("as_review_section");
        reviewSection.append(
            ...reviewForm.querySelectorAll("p, .avatar_block, .content")
        );

        target.after(reviewSection);

        mount(self_, {
            target,
            props: {
                reviewSection
            }
        });
    }
}
