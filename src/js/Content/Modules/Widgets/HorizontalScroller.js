
class HorizontalScroller {

    static create(parentNode, controlLeftNode, controlRightNode) {

        let lastScroll = 0;

        parentNode.addEventListener("wheel", e => {
            e.preventDefault();
            e.stopPropagation();

            if (Date.now() - lastScroll < 200) { return; }
            lastScroll = Date.now();

            const isScrollDown = e.deltaY > 0;
            if (isScrollDown) {
                controlRightNode.click();
            } else {
                controlLeftNode.click();
            }
        });
    }
}

export {HorizontalScroller};
