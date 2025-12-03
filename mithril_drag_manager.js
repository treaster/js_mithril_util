'use strict';

import { mu, cancelLongPress } from './mithril_util.js';

// An object to manage drag & drop operations with either mouse or touch events.
// Instantiate the DragManager.
// Call makeDragSource() on drag source/pickup elements.
// Call makeDragTarget() on drag target/drop elements.

function addClass(element, className) {
  removeClass(element, className);
  element.className = element.className + ' ' + className;
}

function removeClass(element, className) {
  var re = new RegExp('\\b' + className + '\\b', 'g');
  element.className = element.className.replace(re, '');
}


export class DragManager {
    constructor() {
        this._dragData = null;
        this._dragSrcElement = null;;
        this._dragElementTree = null;
        this._currentTouchTarget = null;
        this._dragMode = {};
        this._clickShortcuts = {};  // map[tag]function()
        this._keyMode = false;

        this._startX = null;
        this._startY = null;
        this._dragStartFn = null;
        this._dragCancelFn = null;

        this._isRealDrag = false;

        // Disable drag & drop on mouseup, on tab change, on lock screen, etc.
        this._clearDragWithRender = evt => {
            this._clearDrag(false);
            m.redraw();
        };

        this._bodyDragmove = evt => {
            this._setElementXYFromEvent(evt, this._dragElementTree);
        }

        this._blockAltDefault = evt => {
            if (evt.altKey) {
                evt.preventDefault();
            }
        }

        this._setIsRealDrag = (evt) => {
            if (this._isRealDrag) {
                return;
            }

            let loc = evt;
            if (evt.changedTouches) {
                loc = evt.changedTouches[0];
            }

            const dx = loc.clientX - this._startX;
            const dy = loc.clientY - this._startY;
            const threshold = evt.srcElement.clientHeight / 2;
            if (dx * dx + dy * dy < threshold) {
                return;
            }

            this._isRealDrag = true;

            if (this._dragStartFn) {
                this._dragStartFn();
            }

            // Clone the parent node because in makeDragSource we apply an
            // "event capture overlay" element to the intuitive drag source.
            //
            // Final structure is like this (for Griddle):
            // tile_cell
            //     A. tile display elements (letter, points). These Hide when drag
            //        starts.
            //     B. actual drag target. this invisible element captures the
            //        touch event, so when we hide/remove (A) on the source, we
            //        still have our event surface.
            var clone = this._dragSrcElement.parentNode.cloneNode(true);
            clone.style.position = 'absolute';
            addClass(clone, 'dragging');

            // addClass(clone, 'drag_phantom');
            this._setElementXYFromEvent(evt, clone);
            this._dragElementTree = clone;
            document.getElementById('app_root').appendChild(clone);
            document.body.addEventListener('mousemove', this._bodyDragmove);
            document.body.addEventListener('touchmove', this._bodyDragmove);

            // cancel the long press
            cancelLongPress();
        };
    }

    // Attach global event listeners.
    start() {
        // Prevent Alt from activating any sort of menu behavior.
        document.addEventListener('keydown', this._blockAltDefault, false);
    }

    // Detach global event listeners.
    stop() {
        document.removeEventListener('keydown', this._blockAltDefault);
    }


    // Make an element pickupable with drag & drop by adding
    // clickable/touchable surface on top of the existing element.
    // Should be called after all other display elements have been added.
    //
    // element: The Mithril fake-element to make draggable.
    // dragData: Any data that should be passed to the drop target's drag data
    //   param.
    // dataTags: An array of strings indicating which drop targets are valid drops
    //   for this source.
    makeDragSource(element, dragData, dataTags, altTag, ctrlTag, shiftTag, dragStartFn, dragCancelFn) {
        mu('div')
            .appendTo(element)
            .addClass('draggable')
            .attr('tabindex', 1)  // Allows element to receive key events.
            .mousedown(evt => {
                if (evt.button !== 0) {
                    return;
                }
                evt.preventDefault();

                if (this._inKeyMode()) {
                    for (var key in this._dragMode) {
                        this._clickShortcuts[key](dragData, false);
                        return;
                    }
                } else {
                    this._startDrag(evt, dataTags, dragData, evt.currentTarget, dragStartFn, dragCancelFn);
                }
            })
            /*
            // TODO(treaster): Enable this if we need alt/ctrl/shift modifiers enabled.
            // Note that it does odd things with element focus.
            .keydown(evt => {
                evt.preventDefault();
                this._setupClickShortcut(evt, altTag, ctrlTag, shiftTag);
            })
            /*/
            .keyup(evt => {
                evt.preventDefault();
                this._clearDrag(true);
            })
            /*
            // TODO(treaster): Enable this if we need alt/ctrl/shift modifiers enabled.
            // Note that it does odd things with element focus.
            .mouseover(evt => {
                evt.preventDefault();
                this._setupClickShortcut(evt, altTag, ctrlTag, shiftTag);
            })
            */
            .mouseout(evt => {
                evt.preventDefault();

                // Defocus the element so it no longer receives keypresses.
                evt.currentTarget.blur();  
                /*
                if (!this._isDragging()) {
                    this._clearDrag(true);
                }
                */
            })
            .touchstart(evt => {
                // evt.preventDefault();
                this._startDrag(evt, dataTags, dragData, evt.currentTarget, dragStartFn, dragCancelFn);
            })
            .touchmove(evt => {
                // Check if a meaningful touch is in progress. If not, bail.
                if (this._dragData === null) {
                    return;
                }
                if (evt.changedTouches.length == 0) {
                    return;
                }

                // We may not have recognized this as a isRealDrag yet.
                if (!this._dragElementTree) {
                    return;
                }

                // Animate the phantom image of the dragged element.
                this._setElementXYFromEvent(evt, this._dragElementTree);
                var currentTarget = this._getTouchElementFromEvent(evt, dataTags);
                this._setCurrentTouchTarget(currentTarget);
            })
            .touchend(evt => {
                // Check if a meaningful touch is in progress. If not, bail.
                if (this._dragData === null) {
                    return;
                }

                if (!this._isDragging()) {
                    return;
                }

                var currentTarget = this._getTouchElementFromEvent(evt, dataTags);
                if (currentTarget) {
                    var dragMode = currentTarget.getAttribute('data-dragmode');
                    var dropFunc = currentTarget.mtDropFunc;
                    var dragData = this._dragData;

                    if (this._inDragMode(dragMode)) {
                        dropFunc(dragData, true);
                    }
                }

                this._clearDrag(true);
            });

        // Disable the context menu for ctrl+click elements on Mac. Otherwise it gets
        // in the way of ctrl-click drag&drop shortcuts.
        if (window.navigator.platform == 'MacIntel') { //  && ctrlTag != '')
            element.attr('oncontextmenu', evt => {
                if (evt.ctrlKey) {
                    evt.preventDefault();
                    evt.stopPropagation();
                    return false;
                }
                return true;
            });
        }
    }

    // Make an element a drop target for an element prepared with makeDropSource.
    // element: The Mithril fake-element to make targetable.
    // dragMode: string. An element can be dropped here if its dataTags includes
    //   this string.
    // dropFunc: A callback to invoke when the drop occurs. The callback takes
    //   two arguments:
    //   the first corresponds to the dragData argument passed to
    //   makeDragSource() when preparing the dropped element.
    //   the second is a bool which is true if the dropFunc was called for
    //   drag&drop and false if the dropFunc was called with a click shortcut.
    makeDragTarget(element, dragMode, dropFunc) {
        var validTargetClass = 'drag_' + dragMode + '_target';

        if (this._inDragMode(dragMode)) {
            element.addClass('drop_target');
        }

        // We need to match up the dropFunc from a DragTarget with the click event
        // from a DragSource. If a source has multiple targets for the same tag,
        // this will result in the last target receiving the click shortcut events.
        // Try to avoid multiple targets for the same tag for this reason. Multiple
        // targets for different tags (one tag per shortcut key) is okay.
        this._clickShortcuts[dragMode] = dropFunc;

        element
            .addClass(validTargetClass)
            .mouseover(evt => {
                if (this._inDragMode(dragMode)) {
                    evt.preventDefault();
                    evt.stopPropagation();
                    addClass(evt.currentTarget, 'dragtarget_hover');
                }
            })
            .mouseout(evt => {
                if (this._isDragging() && this._inDragMode(dragMode)) {
                    evt.preventDefault();
                    evt.stopPropagation();
                    removeClass(evt.currentTarget, 'dragtarget_hover');
                }
            })
            .mouseup(evt => {
                evt.preventDefault();
                if (this._isDragging() && this._inDragMode(dragMode)) {
                    evt.stopPropagation();
                    var dragData = this._dragData;
                    dropFunc(dragData, true);
                    removeClass(evt.currentTarget, 'dragtarget_hover');
                    this._clearDrag(false);
                }
            })
            .attr('data-dragmode', dragMode)
            .attr('onupdate', vnode => {
                vnode.dom.mtDropFunc = dropFunc;
            })
            .attr('oncreate', vnode => {
                vnode.dom.mtDropFunc = dropFunc;
            });
    }

    // DragManager private methods.
    _getTouchElementFromEvent(evt, sourceDragModes) {
        // Searchable keyword "drag"
        var currentTouch = evt.changedTouches[0];
        var x = currentTouch.clientX;
        var y = currentTouch.clientY;

        var hitTarget =  document.elementFromPoint(x, y);
        while (true) {
            if (hitTarget === null) {
                break;
            }
            if (hitTarget === document) {
                break;
            }
            if (hitTarget.hasAttribute('data-dragmode')) {
                const targetDragMode = hitTarget.getAttribute('data-dragmode');
                if (sourceDragModes.indexOf(targetDragMode) >= 0) {
                    break;
                }
            }
            hitTarget = hitTarget.parentNode;
        }
        if (hitTarget == document) {
            hitTarget = null;
        }
        return hitTarget;
    }

    _setElementXYFromEvent(evt, element) {
        // Pull cursor X, Y position out of either mouse event or touch event.
        var x = 0;
        var y = 0;
        if (evt.changedTouches && evt.changedTouches.length > 0) {
            x = evt.changedTouches[0].clientX;
            y = evt.changedTouches[0].clientY;
        }
        if (evt.clientX) {
            x = evt.clientX;
            y = evt.clientY;
        }

        // We need a small offset from the cursor (+2 here), otherwise we trigger
        // continuous mouseout events as the cursor bobbles between over [whatever]
        // vs over the floating element.
        element.style.left = (x + window.scrollX + 2) + 'px';
        element.style.top = (y + window.scrollY + 2) + 'px';
    }

    _startDrag(evt, dragTags, dragData, dragSrcElement, dragStartFn, dragCancelFn) {
        if (Object.keys(this._dragMode).length != 0) {
            this._clearDrag(true);
        }

        if (this._startX === null) {
            let loc = evt;
            if (evt.changedTouches) {
                loc = evt.changedTouches[0];
            }

            this._startX = loc.clientX;
            this._startY = loc.clientY;
        }

        this._dragStartFn = dragStartFn;
        this._dragCancelFn = dragCancelFn;

        this._setDragMode(dragTags);
        this._dragData = dragData;
        this._dragSrcElement = dragSrcElement;

        // End the drag & drop on mouseup, on tab change, on lock screen, etc.
        window.addEventListener('mouseup', this._clearDragWithRender, false);
        window.addEventListener('touchend', this._clearDragWithRender, false);
        window.addEventListener('blur', this._clearDragWithRender, false);
        window.addEventListener('mousemove', this._setIsRealDrag, false);
        window.addEventListener('touchmove', this._setIsRealDrag, false);
        document.addEventListener(
            'visibilitychange', this._clearDragWithRender, false);
    }

    _setDragMode(dragTags) {
        this._dragMode = {};
        for (var i = 0; i < dragTags.length; ++i) {
            var dragMode = dragTags[i];
            this._dragMode[dragMode] = true;
        }
    }

    // Changes the DragManager's state such that the current click shortcut behavior
    // is keyed to the current hover/click element.
    _setupClickShortcut(evt, altTag, ctrlTag, shiftTag) {
        // Focus the element (on mouseover) so it can receive keypresses.
        evt.currentTarget.focus();
        this._keyMode = evt.altKey || evt.ctrlKey || evt.shiftKey;
        if (altTag && evt.altKey && !this._inDragMode(altTag)) {
            this._clearDrag(true);
            this._setDragMode([altTag]);
        }
        if (ctrlTag && evt.ctrlKey && !this._inDragMode(ctrlTag)) {
            this._clearDrag(true);
            this._setDragMode([ctrlTag]);
        }
        if (shiftTag && evt.shiftKey && !this._inDragMode(shiftTag)) {
            this._clearDrag(true);
            this._setDragMode([shiftTag]);
        }
    }

    _inDragMode(key) {
        return key in this._dragMode;
    }

    _isDragging() {
        return this._dragElementTree != null;
    }

    // Return whether or not a click shortcut key is pressed while hovering over
    // a draggable element.
    _inKeyMode() {
        return this._keyMode;
    }

    _clearDrag(forceClearInKeyMode) {
        if (this._inKeyMode() && !forceClearInKeyMode) {
            return;
        }
        document.body.removeEventListener('mousemove', this._bodyDragmove);
        document.body.removeEventListener('touchmove', this._bodyDragmove);
        this._isRealDrag = false;
        this._startX = null;
        this._startY = null;
        this._dragData = null;
        this._setDragMode([]);  // dragMode takes array of keys.
        this._setCurrentTouchTarget(null);
        var dragImage = this._dragElementTree;
        if (dragImage) {
            dragImage.parentNode.removeChild(dragImage);
            this._dragElementTree = null;
        }

        if (this._dragCancelFn) {
            this._dragCancelFn();
        }

        window.removeEventListener('mouseup', this._clearDragWithRender, false);
        window.removeEventListener('touchend', this._clearDragWithRender, false);
        window.removeEventListener('blur', this._clearDragWithRender, false);
        window.removeEventListener('mousemove', this._setIsRealDrag, false);
        window.removeEventListener('touchmove', this._setIsRealDrag, false);
        document.removeEventListener(
            'visibilitychange', this._clearDragWithRender, false);
    }

    _setCurrentTouchTarget(newTarget) {
        var oldTarget = this._currentTouchTarget;
        if (newTarget != oldTarget) {
            if (oldTarget) {
                removeClass(oldTarget, 'dragtarget_hover');
            }

            if (newTarget) {
                var dragMode = newTarget.getAttribute('data-dragmode');
                if (this._inDragMode(dragMode)) {
                    addClass(newTarget, 'dragtarget_hover');
                }
            }
        }
        this._currentTouchTarget = newTarget;
    }
}
