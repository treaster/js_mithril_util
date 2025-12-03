'use strict';

/**
 * @param {string} tagname
 * @returns {MuElement}
 */
export function mu(tagname) {
    return new MuElement(tagname);
}


export class MuElement {
    constructor(tagName) {
        this.tag = tagName;
        this.attrs = {};
        this.children = [];
        this.text = undefined;
        this.key = undefined;

        this._tm_configs = [];

        this._handler_lists = {};
    }

    _initChildren() {
        if (this.children === undefined) {
            this.children = [];
        }
    }

    _multiHandler(key, newHandler) {
        if (!this._handler_lists[key]) {
            this._handler_lists[key] = [];
        }

        let handlers = this._handler_lists[key];
        handlers.push(newHandler);
        if (!this.attrs[key]) {
            this.attrs[key] = (evt) => {
                for (let i = 0; i < handlers.length; ++i) {
                    handlers[i](evt);
                }
            };
        }
    }

    num_children() {
        if (this.children === undefined) {
            return 0;
        }
        return this.children.length;
    }

    mkey(mkey) {
        this.attrs['key'] = mkey;
        return this;
    }

    attr(key, value) {
        this.attrs[key] = value;
        return this;
    }

    attrIf(condition, key, value) {
        if (condition) {
            this.attrs[key] = value;
        }
        return this;
    }

    blur(onBlur) {
        this.attrs['onblur'] = onBlur;
        return this;
    }

    change(onChange) {
        this.attrs['onchange'] = onChange;
        return this;
    }

    /**
     * @returns {MuElement}
     */
    click(onClick) {
        this.attrs['onclick'] = onClick;
        return this;
    }

    /**
     * @returns {MuElement}
     */
    longPress(onShortPress, onLongPress, onDblClick) {
        // We tried to store the timeout state in a local variable, but since
        // this handler is re-invoked on every page render by Mithril, the
        // bound local variable changes every time and the state is lost or
        // scrambled instantly. The scope of the state variable needs to be
        // something more stable. Ideally a hook in the application state, but
        // piping it through this far is hard. We'll try some nasty global state
        // for now, which has the pleasant side effect that the application gets
        // long-press behavior for free.
        let cancelLongPress = () => {
            clearTimeout(LONG_PRESS_MANAGER.long_press_timeout_id);
            LONG_PRESS_MANAGER.long_press_timeout_id = null;
            LONG_PRESS_MANAGER.long_press_start_x = null;
            LONG_PRESS_MANAGER.long_press_start_y = null;
            LONG_PRESS_MANAGER.long_press_cancel_fn = null;
        }

        let clearDblClick = () => {
            clearTimeout(LONG_PRESS_MANAGER.dbl_click_timeout_id);
            LONG_PRESS_MANAGER.dbl_click_timeout_id = null;
            LONG_PRESS_MANAGER.dbl_click_first_element = null;
        }

        let downHandler = evt => {
            evt.preventDefault();

            // If we're in a doubleclick, fire the doubleclick handler and
            // do nothing else.
            if (onDblClick && LONG_PRESS_MANAGER.dbl_click_timeout_id !== null) {
                if (evt.srcElement === LONG_PRESS_MANAGER.dbl_click_first_element) {
                    onDblClick(evt);
                }
                clearDblClick();
                return;
            }

            // If we're not in doubleclick, note the first click and set up the
            // cancellation.
            if (onDblClick) {
                LONG_PRESS_MANAGER.dbl_click_first_element = evt.srcElement;

                LONG_PRESS_MANAGER.dbl_click_timeout_id = setTimeout(() => {
                    clearDblClick();
                }, 500);
            }

            if (onLongPress) {
                LONG_PRESS_MANAGER.long_press_timeout_id = setTimeout(() => {
                    LONG_PRESS_MANAGER.long_press_cancel_fn();
                    onLongPress(evt);
                }, 500);

                let loc = evt;
                if (evt.changedTouches) {
                    loc = evt.changedTouches[0];
                }
                LONG_PRESS_MANAGER.long_press_start_x = loc.clientX;
                LONG_PRESS_MANAGER.long_press_start_y = loc.clientY;
                LONG_PRESS_MANAGER.long_press_cancel_fn = cancelLongPress
            }
        };

        let upHandler = evt => {
            if (LONG_PRESS_MANAGER.long_press_timeout_id !== null) {
                evt.preventDefault();
                LONG_PRESS_MANAGER.long_press_cancel_fn();
                if (onShortPress) {
                    onShortPress(evt);
                }
            }
        };

        let moveHandler = evt => {
            if (LONG_PRESS_MANAGER.long_press_timeout_id != null) {
                evt.preventDefault();

                let loc = evt;
                if (evt.changedTouches) {
                    loc = evt.changedTouches[0];
                }
                const threshold = evt.srcElement.clientHeight / 2;
                let dx = loc.clientX - LONG_PRESS_MANAGER.long_press_start_x;
                let dy = loc.clientY - LONG_PRESS_MANAGER.long_press_start_y;
                if (dx * dx + dy * dy < threshold) {
                    return;
                }

                LONG_PRESS_MANAGER.long_press_cancel_fn();
            }
        };


        this.mousedown(downHandler);
        this.mouseup(upHandler);
        this.mousemove(moveHandler);

        this.touchstart(downHandler);
        this.touchend(upHandler);
        this.touchmove(moveHandler);

        return this;
    }

    /**
     * @returns {MuElement}
     */
    config(config) {
        this._tm_configs.push(config);
        if (!this.attrs['config']) {
            this.attrs['config'] = (element, isInitialized, context) => {
                for (let i = 0; i < this._tm_configs.length; ++i) {
                    this._tm_configs[i](element, isInitialized, context);
                }
            }
        }
        return this;
    }

    /**
     * @returns {MuElement}
     */
    dragstart(onDragStart) {
        this.attrs['ondragstart'] = onDragStart;
        return this;
    }

    /**
     * @returns {MuElement}
     */
    dragenter(onDragEnter) {
        this.attrs['ondragenter'] = onDragEnter;
        return this;
    }

    /**
     * @returns {MuElement}
     */
    dragover(onDragOver) {
        this.attrs['ondragover'] = onDragOver;
        return this;
    }

    /**
     * @returns {MuElement}
     */
    dragleave(onDragLeave) {
        this.attrs['ondragleave'] = onDragLeave;
        return this;
    }

    /**
     * @returns {MuElement}
     */
    dropfunction(onDrop) {
        this.attrs['ondrop'] = onDrop;
        return this;
    }

    /**
     * @returns {MuElement}
     */
    input(onInput) {
        this.attrs['oninput'] = onInput;
        return this;
    }

    /**
     * @returns {MuElement}
     */
    keydown(onKeyDown) {
        this.attrs['onkeydown'] = onKeyDown;
        return this;
    }

    /**
     * @returns {MuElement}
     */
    keyup(onKeyUp) {
        this.attrs['onkeyup'] = onKeyUp;
        return this;
    }

    /**
     * @returns {MuElement}
     */
    mousedown(onMouseDown) {
        this._multiHandler('onmousedown', onMouseDown);
        return this;
    }

    /**
     * @returns {MuElement}
     */
    mousemove(onMouseMove) {
        this._multiHandler('onmousemove', onMouseMove);
        return this;
    }

    /**
     * @returns {MuElement}
     */
    mouseover(onMouseOver) {
        this._multiHandler('onmouseover', onMouseOver);
        return this;
    }

    /**
     * @returns {MuElement}
     */
    mouseout(onMouseOut) {
        this._multiHandler('onmouseout', onMouseOut);
        return this;
    }

    /**
     * @returns {MuElement}
     */
    mouseup(onMouseUp) {
        this._multiHandler('onmouseup', onMouseUp);
        return this;
    }

    /**
     * @returns {MuElement}
     */
    pointerdown(onpointerDown) {
        this.attrs['onpointerdown'] = onpointerDown;
        return this;
    }

    /**
     * @returns {MuElement}
     */
    pointermove(onpointerMove) {
        this.attrs['onpointermove'] = onpointerMove;
        return this;
    }

    /**
     * @returns {MuElement}
     */
    pointerover(onPointerOver) {
        this._multiHandler('onpointerover', onPointerOver);
        return this;
    }

    /**
     * @returns {MuElement}
     */
    pointerout(onPointerOut) {
        this._multiHandler('onpointerout', onPointerOut);
        return this;
    }

    /**
     * @returns {MuElement}
     */
    pointerup(onPointerUp) {
        this._multiHandler('onpointerup', onPointerUp);
        return this;
    }

    /**
     * @returns {MuElement}
     */
    submit(onSubmit) {
        this.attrs['onsubmit'] = onSubmit;
        return this;
    }

    /**
     * @returns {MuElement}
     */
    touchcancel(onTouchCancel) {
        this.attrs['ontouchcancel'] = onTouchCancel;
        return this;
    }

    /**
     * @returns {MuElement}
     */
    touchend(onTouchEnd) {
        this._multiHandler('ontouchend', onTouchEnd);
        return this;
    }

    touchleave(onTouchLeave) {
        // OnTouchLeave is NOT A THING. Don't call this method.
        throw new Error("OnTouchLeave is NOT A THING");
    }

    /**
     * @returns {MuElement}
     */
    touchmove(onTouchMove) {
        this._multiHandler('ontouchmove', onTouchMove);
        return this;
    }

    /**
     * @returns {MuElement}
     */
    touchstart(onTouchStart) {
        this._multiHandler('ontouchstart', onTouchStart);
        return this;
    }


    /**
     * @returns {MuElement}
     */
    key(key) {
        this.attrs['key'] = key;
        return this;
    }

    /**
     * @returns {MuElement}
     */
    addClass(className) {
        let origClass = this.attrs['class'];
        if (origClass == undefined) {
            this.attrs['class'] = className;
        } else {
            this.attrs['class'] = origClass + ' ' + className;
        }
        return this;
    }

    /**
     * @returns {MuElement}
     */
    addClassIf(condition, className) {
        if (!condition) {
            return this;
        }
        let origClass = this.attrs['class'];
        if (origClass == undefined) {
            this.attrs['class'] = className;
        } else {
            this.attrs['class'] = origClass + ' ' + className;
        }
        return this;
    }

    /**
     * @returns {MuElement}
     */
    style(attribute, value) {
        let style = {};
        if ('style' in this.attrs) {
            style = this.attrs.style;
        }
        style[attribute] = value;
        this.attrs.style = style;
        return this;
    }

    /**
     * @returns {MuElement}
     */
    appendTo(parentElement) {
        parentElement.append(this);
        return this;
    }

    /**
     * @returns {MuElement}
     */
    append(child) {
        this._initChildren();
        this.children.push(child);
        return this;
    }

    /**
     * @returns {MuElement}
     */
    appendList(children) {
        for (let i = 0; i < children.length; ++i) {
            this.append(children[i]);
        }
        return this;
    }

    /**
     * @returns {MuElement}
     */
    appendIf(condition, child) {
        if (condition) {
            this._initChildren();
            this.children.push(child);
        }
        return this;
    }

    /**
     * @returns {MuElement}
     */
    appendTextNode(text) {
        if (typeof text === 'number') {
            text = `${text}`;
        }
        if (typeof text === 'string') {
            if (text !== '') {
                // text = text;
            } else {
                // console.log('Using empty string in mithril_util text().');
            }
        } else {
            text = 'mithril_util error';
            console.log(`Non-string, non-number argument to text(): "${text}"`);
        }
        this.append({
            tag: "#",
            children: text,
        });
        return this;
    }

    /**
     * @returns {MuElement}
     */
    map(elements, func) {
        for (let i = 0; i < elements.length; ++i) {
            let item = func(elements[i]);
            this.append(item);
        }
        return this;
    }

    /**
     * @returns {MuElement}
     */
    setText(text) {
        return this.appendTextNode(text);

    }

    /**
     * @returns {MuElement}
     */
    runIf(condition, func) {
        if (condition) {
            func(this);
        }
        return this;
    }

    /**
     * @returns {MuElement}
     */
    setInnerHtml(html) {
        this.attr('oncreate', (vnode) => {
            vnode.dom.innerHTML = html;
        });
        return this;
    }
}


/**
 * @param {MuElement} e
 * @returns {string}
 */
export function toHtml(e) {
    let attrs = [];
    for (let k in e.attrs) {
        let v = e.attrs[k];
        attrs.push(`${k}="${v}"`);
    }
    let attrsString = attrs.join(" ");

    let children = [];
    for (let i = 0; i < e.children.length; ++i) {
        let child = e.children[i];
        children.push(toHtml(child));
    }

    let childrenString = children.join("");
    return `<${e.tag} ${attrsString}>${childrenString}</${e.tag}>`;
}


// LongPressManager is a global entity to track long-press events, and
// (especially) make them cancellable. Works with DragManager, in
// mithril_drag_manager.js.
// We don't love this global-state implementation, but it works okay for now.
class LongPressManager {
    constructor() {
        this.dbl_click_timeout_id = null;
        this.dbl_click_first_element = null;

        this.long_press_timeout_id = null;
        this.long_press_start_x = null;
        this.long_press_start_y = null;
        this.long_press_cancel_fn = null;
    }
}

const LONG_PRESS_MANAGER = new LongPressManager();

export function cancelLongPress() {
    if (LONG_PRESS_MANAGER.long_press_cancel_fn) {
        LONG_PRESS_MANAGER.long_press_cancel_fn();
    }
}
