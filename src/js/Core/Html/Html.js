
class HTML {

    static escape(str) {

        // @see https://stackoverflow.com/a/4835406
        const map = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return str.replace(/[&<>"']/g, (m) => { return map[m]; });
    }

    static fragment(html) {
        const template = document.createElement("template");
        template.innerHTML = DOMPurify.sanitize(html);
        return template.content;
    }

    static element(html) {
        return HTML.fragment(html).firstElementChild;
    }

    static _getNode(node) {
        let _node = node;

        if (typeof _node == "undefined" || _node === null) {
            console.warn(`${_node} is not an Element.`);
            return null;
        }
        if (typeof _node == "string") {
            _node = document.querySelector(_node);
        }
        if (!(_node instanceof Element)) {
            console.warn(`${_node} is not an Element.`);
            return null;
        }

        return _node;
    }

    static inner(node, html) {
        const _node = HTML._getNode(node);

        if (_node) {
            _node.innerHTML = DOMPurify.sanitize(html);
        }
        return _node;
    }

    static replace(node, html) {
        const _node = HTML._getNode(node);

        if (_node) {
            _node.outerHTML = DOMPurify.sanitize(html);
        }
        return _node;
    }

    static wrap(node, html) {
        const _node = HTML._getNode(node);

        if (_node) {
            const wrapper = HTML.element(html);
            _node.replaceWith(wrapper);
            wrapper.append(_node);
            return wrapper;
        } else {
            return _node;
        }
    }

    static adjacent(node, position, html) {
        const _node = HTML._getNode(node);

        if (_node) {
            _node.insertAdjacentHTML(position, DOMPurify.sanitize(html));
        }
        return _node;
    }

    static beforeBegin(node, html) {
        HTML.adjacent(node, "beforebegin", html);
    }

    static afterBegin(node, html) {
        HTML.adjacent(node, "afterbegin", html);
    }

    static beforeEnd(node, html) {
        HTML.adjacent(node, "beforeend", html);
    }

    static afterEnd(node, html) {
        HTML.adjacent(node, "afterend", html);
    }
}

export {HTML};
