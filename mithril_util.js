'use strict';

export function mu(tagName) {
    return new Element(tagName);
}


class SecretGlobalState {
    constructor() {
        this.DBL_CLICK_TIMEOUT_ID = null;
        this.DBL_CLICK_FIRST_ELEMENT = null;

        this.LONG_PRESS_TIMEOUT_ID = null;
        this.LONG_PRESS_START_X = null;
        this.LONG_PRESS_START_Y = null;
        this.LONG_PRESS_CANCEL_FN = null;
    }
}

export const secretGlobalState = new SecretGlobalState();


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


class Element {
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

    click(onClick) {
        this.attrs['onclick'] = onClick;
        return this;
    }

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
            clearTimeout(secretGlobalState.LONG_PRESS_TIMEOUT_ID);
            secretGlobalState.LONG_PRESS_TIMEOUT_ID = null;
            secretGlobalState.LONG_PRESS_START_X = null;
            secretGlobalState.LONG_PRESS_START_Y = null;
            secretGlobalState.LONG_PRESS_CANCEL_FN = null;
        }

        let clearDblClick = () => {
            clearTimeout(secretGlobalState.DBL_CLICK_TIMEOUT_ID);
            secretGlobalState.DBL_CLICK_TIMEOUT_ID = null;
            secretGlobalState.DBL_CLICK_FIRST_ELEMENT = null;
        }

        let downHandler = evt => {
            evt.preventDefault();

            // If we're in a doubleclick, fire the doubleclick handler and
            // do nothing else.
            if (onDblClick && secretGlobalState.DBL_CLICK_TIMEOUT_ID !== null) {
                if (evt.srcElement === secretGlobalState.DBL_CLICK_FIRST_ELEMENT) {
                    onDblClick(evt);
                }
                clearDblClick();
                return;
            }

            // If we're not in doubleclick, note the first click and set up the
            // cancellation.
            if (onDblClick) {
                secretGlobalState.DBL_CLICK_FIRST_ELEMENT = evt.srcElement;

                secretGlobalState.DBL_CLICK_TIMEOUT_ID = setTimeout(() => {
                    clearDblClick();
                }, 500);
            }

            if (onLongPress) {
                secretGlobalState.LONG_PRESS_TIMEOUT_ID = setTimeout(() => {
                    secretGlobalState.LONG_PRESS_CANCEL_FN();
                    onLongPress(evt);
                }, 500);
    
                let loc = evt;
                if (evt.changedTouches) {
                    loc = evt.changedTouches[0];
                }
                secretGlobalState.LONG_PRESS_START_X = loc.clientX;
                secretGlobalState.LONG_PRESS_START_Y = loc.clientY;
                secretGlobalState.LONG_PRESS_CANCEL_FN = cancelLongPress
            }
        };

        let upHandler = evt => {
            if (secretGlobalState.LONG_PRESS_TIMEOUT_ID !== null) {
                evt.preventDefault();
                secretGlobalState.LONG_PRESS_CANCEL_FN();
                if (onShortPress) {
                    onShortPress(evt);
                }
            }
        };

        let moveHandler = evt => {
            if (secretGlobalState.LONG_PRESS_TIMEOUT_ID != null) {
                evt.preventDefault();

                let loc = evt;
                if (evt.changedTouches) {
                    loc = evt.changedTouches[0];
                }
                const threshold = evt.srcElement.clientHeight / 2;
                let dx = loc.clientX - secretGlobalState.LONG_PRESS_START_X;
                let dy = loc.clientY - secretGlobalState.LONG_PRESS_START_Y;
                if (dx * dx + dy * dy < threshold) {
                    return;
                }

                secretGlobalState.LONG_PRESS_CANCEL_FN();
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

    dragstart(onDragStart) {
        this.attrs['ondragstart'] = onDragStart;
        return this;
    }

    dragenter(onDragEnter) {
        this.attrs['ondragenter'] = onDragEnter;
        return this;
    }

    dragover(onDragOver) {
        this.attrs['ondragover'] = onDragOver;
        return this;
    }

    dragleave(onDragLeave) {
        this.attrs['ondragleave'] = onDragLeave;
        return this;
    }

    dropfunction(onDrop) {
        this.attrs['ondrop'] = onDrop;
        return this;
    }

    input(onInput) {
        this.attrs['oninput'] = onInput;
        return this;
    }

    keydown(onKeyDown) {
        this.attrs['onkeydown'] = onKeyDown;
        return this;
    }

    keyup(onKeyUp) {
        this.attrs['onkeyup'] = onKeyUp;
        return this;
    }

    mousedown(onMouseDown) {
        this._multiHandler('onmousedown', onMouseDown);
        return this;
    }

    mousemove(onMouseMove) {
        this._multiHandler('onmousemove', onMouseMove);
        return this;
    }

    mouseover(onMouseOver) {
        this._multiHandler('onmouseover', onMouseOver);
        return this;
    }

    mouseout(onMouseOut) {
        this._multiHandler('onmouseout', onMouseOut);
        return this;
    }

    mouseup(onMouseUp) {
        this._multiHandler('onmouseup', onMouseUp);
        return this;
    }

    pointerdown(onpointerDown) {
        this.attrs['onpointerdown'] = onpointerDown;
        return this;
    }

    pointermove(onpointerMove) {
        this.attrs['onpointermove'] = onpointerMove;
        return this;
    }

    pointerover(onPointerOver) {
        this._multiHandler('onpointerover', onPointerOver);
        return this;
    }

    pointerout(onPointerOut) {
        this._multiHandler('onpointerout', onPointerOut);
        return this;
    }

    pointerup(onPointerUp) {
        this._multiHandler('onpointerup', onPointerUp);
        return this;
    }

    submit(onSubmit) {
        this.attrs['onsubmit'] = onSubmit;
        return this;
    }

    touchcancel(onTouchCancel) {
        this.attrs['ontouchcancel'] = onTouchCancel;
        return this;
    }

    touchend(onTouchEnd) {
        this._multiHandler('ontouchend', onTouchEnd);
        return this;
    }

    // OnTouchLeave is NOT A THING
    touchleave(onTouchLeave) {
        throw new Error("OnTouchLeave is NOT A THING");
    }

    touchmove(onTouchMove) {
        this._multiHandler('ontouchmove', onTouchMove);
        return this;
    }

    touchstart(onTouchStart) {
        this._multiHandler('ontouchstart', onTouchStart);
        return this;
    }


    key(key) {
        this.attrs['key'] = key;
        return this;
    }

    addClass(className) {
        let origClass = this.attrs['class'];
        if (origClass == undefined) {
            this.attrs['class'] = className;
        } else {
            this.attrs['class'] = origClass + ' ' + className;
        }
        return this;
    }

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

    style(attribute, value) {
        let style = {};
        if ('style' in this.attrs) {
            style = this.attrs.style;
        }
        style[attribute] = value;
        this.attrs.style = style;
        return this;
    }

    appendTo(parentElement) {
        parentElement.append(this);
        return this;
    }

    append(child) {
        this._initChildren();
        this.children.push(child);
        return this;
    }

    appendList(children) {
        for (let i = 0; i < children.length; ++i) {
            this.append(children[i]);
        }
        return this;
    }

    appendIf(condition, child) {
        if (condition) {
            this._initChildren();
            this.children.push(child);
        }
        return this;
    }

    map(elements, func) {
        for (let i = 0; i < elements.length; ++i) {
            let item = func(elements[i]);
            this.append(item);
        }
        return this;
    }

    setText(text) {
        if (typeof text === 'number') {
            text = '' + text;
        }
        if (typeof text === 'string') {
            if (text !== '') {
                // text = text;
            } else {
                // console.log('Using empty string in mithril_util text().');
            }
        } else {
            text = 'mithril_util error';
            console.log('Non-string, non-number argument to text(): "' + text + '"');
        }
        this.append({
            tag: "#",
            children: text,
        });
        return this;
    }

    runIf(condition, func) {
        if (condition) {
            func(this);
        }
        return this;
    }

    setInnerHtml(html) {
        this.attr('oncreate', (vnode) => {
            vnode.dom.innerHTML = html;
        });
        return this;
    }
}
