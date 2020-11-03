
class Viewport {

    // only concerned with vertical at this point
    static isElementInViewport(elem) {
        let elemTop = elem.offsetTop;
        let parent = elem.offsetParent;
        while (parent) {
            elemTop += parent.offsetTop;
            parent = parent.offsetParent;
        }

        const elemBottom = elemTop + elem.getBoundingClientRect().height;
        const viewportTop = window.scrollY;
        const viewportBottom = window.innerHeight + viewportTop;

        return (elemBottom <= viewportBottom && elemTop >= viewportTop);
    }
}

export {Viewport};
