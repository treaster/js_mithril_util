// An object to manage drag & drop operations with either mouse or touch events.
// Instantiate the DragManager.
// Call makeDragSource() on drag source/pickup elements.
// Call makeDragTarget() on drag target/drop elements.

TMITHRIL_UTIL.DragManager = function() {
  this._dragData = m.prop(null);
  this._dragElementTree = null;
  this._currentTouchTarget = null;
  this._dragMode = {};
  this._clickShortcuts = {};  // map[tag]function()
  this._keyMode = false;

  // Disable drag & drop on mouseup, on tab change, on lock screen, etc.
  this._clearDragWithRender = function(evt) {
    m.startComputation();
    this._clearDrag(false);
    m.endComputation();
  }.bind(this);  // Needed here for this function's use as an event listener.

  this._bodyDragmove = function(evt) {
    this._setElementXYFromEvent(evt, this._dragElementTree);
  }.bind(this);  // Needed here for this function's use as an event listener.

  this._blockAltDefault = function(evt) {
    if (evt.altKey) { evt.preventDefault(); }
  }

  // Prevent Alt from activating any sort of menu behavior.
  document.addEventListener('keydown', this._blockAltDefault, false);
};

TMITHRIL_UTIL.DragManager.prototype.stop = function() {
  document.removeEventListener('keydown', this._blockAltDefault);
};


// Make an element pickupable with drag & drop.
// element: The Mithril fake-element to make draggable.
// dragData: Any data that should be passed to the drop target's drag data
//   param.
// dataTags: An array of strings indicating which drop targets are valid drops
//   for this source.
TMITHRIL_UTIL.DragManager.prototype.makeDragSource =
    function(element, dragData, dataTags, altTag, ctrlTag, shiftTag) {
  element
    .addClass('draggable')
    .attr('tabindex', 1)  // Allows element to receive key events.
    .mousedown(function(evt) {
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
        this._startDrag(evt, dataTags, dragData, evt.currentTarget);
      }
    }.bind(this))
    .keydown(function(evt) {
      evt.preventDefault();
      this._setupClickShortcut(evt, altTag, ctrlTag, shiftTag);
    }.bind(this))
    .keyup(function(evt) {
      evt.preventDefault();
      this._clearDrag(true);
    }.bind(this))
    .mouseover(function(evt) {
      evt.preventDefault();
      this._setupClickShortcut(evt, altTag, ctrlTag, shiftTag);
    }.bind(this))
    .mouseout(function(evt) {
      evt.preventDefault();

      // Defocus the element so it no longer receives keypresses.
      evt.currentTarget.blur();  
      if (!this._isDragging()) {
        this._clearDrag(true);
      }
    }.bind(this))
    .touchstart(function(evt) {
          evt.preventDefault();
          console.log('Touchstart ' + evt.currentTarget);
          this._startDrag(evt, dataTags, dragData, evt.currentTarget);
        }.bind(this))
    .touchmove(function(evt) {
          // Check if a meaningful touch is in progress. If not, bail.
          if (this._dragData() == null) { return; }
          if (evt.changedTouches.length == 0) { return; }

          // Animate the phantom image of the dragged element.
          this._setElementXYFromEvent(evt, this._dragElementTree);
          evt.preventDefault();
          console.log('Touchmove ' + evt.currentTarget);
          var currentTarget = this._getTouchElementFromEvent(evt);
          this._setCurrentTouchTarget(currentTarget);
        }.bind(this))
    .touchend(function(evt) {
        // Check if a meaningful touch is in progress. If not, bail.
        if (this._dragData() == null) { return; }
        evt.preventDefault();
        console.log('Touchend ' + evt.currentTarget);

        var currentTarget = this._getTouchElementFromEvent(evt);
        if (currentTarget) {
          var dragMode = currentTarget.getAttribute('data-dragmode');
          var dropFunc = currentTarget.mtDropFunc;
          var dragData = this._dragData();

          if (this._inDragMode(dragMode)) {
            dropFunc(dragData, true);
          }
        }

        this._clearDrag(true);
      }.bind(this));

  // Disable the context menu for ctrl+click elements on Mac. Otherwise it gets
  // in the way of ctrl-click drag&drop shortcuts.
  if (window.navigator.platform == 'MacIntel') { //  && ctrlTag != '') {
    element.attr('oncontextmenu', function(evt) {
      if (evt.ctrlKey) {
        evt.preventDefault();
        evt.stopPropagation();
        return false;
      }
      return true;
    });
  }
};


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
TMITHRIL_UTIL.DragManager.prototype.makeDragTarget =
    function(element, dragMode, dropFunc) {
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
    .mouseover(function(evt) {
      evt.preventDefault();
      evt.stopPropagation();
      if (this._inDragMode(dragMode)) {
        addClass(evt.currentTarget, 'dragtarget_hover');
      }
    }.bind(this))
    .mouseout(function(evt) {
      evt.preventDefault();
      evt.stopPropagation();
      removeClass(evt.currentTarget, 'dragtarget_hover');
    }.bind(this))
    .mouseup(function(evt) {
      evt.preventDefault();
      evt.stopPropagation();
      if (this._isDragging()) {
        var dragData = this._dragData();
        if (this._inDragMode(dragMode)) {
          dropFunc(dragData, true);
        } 
        removeClass(evt.currentTarget, 'dragtarget_hover');
        this._clearDrag(false);
      }
    }.bind(this))
    .attr('data-dragmode', dragMode)
    .config(function(element, isInitialized, context) {
      if (isInitialized) { return; }
      element.mtDropFunc = dropFunc;
    }.bind(this));
};


// DragManager private methods.

TMITHRIL_UTIL.DragManager.prototype._getTouchElementFromEvent = function(evt) {
  // Searchable keyword "drag"
  var currentTouch = evt.changedTouches[0];
  var x = currentTouch.clientX;
  var y = currentTouch.clientY;

  var hitTarget =  document.elementFromPoint(x, y);
  while (hitTarget != null &&
         hitTarget != document &&
         !hitTarget.hasAttribute('data-dragmode')) {
    hitTarget = hitTarget.parentNode;
  }
  if (hitTarget == document) { hitTarget = null; }
  return hitTarget;
};


TMITHRIL_UTIL.DragManager.prototype._setElementXYFromEvent =
    function(evt, element) {
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
};


TMITHRIL_UTIL.DragManager.prototype._startDrag =
    function(evt, dragTags, dragData, dragElement) {
  if (Object.keys(this._dragMode).length != 0) {
    this._clearDrag(true);
  }

  this._setDragMode(dragTags);
  this._dragData(dragData);
  var clone = dragElement.cloneNode(true);
  addClass(clone, 'drag_phantom');
  this._setElementXYFromEvent(evt, clone);
  this._dragElementTree = clone;
  document.body.appendChild(clone);
  document.body.addEventListener('mousemove', this._bodyDragmove);

  // Disable drag & drop on mouseup, on tab change, on lock screen, etc.
  window.addEventListener('mouseup', this._clearDragWithRender, false);
  window.addEventListener('blur', this._clearDragWithRender, false);
  document.addEventListener(
      'visibilitychange', this._clearDragWithRender, false);
};


TMITHRIL_UTIL.DragManager.prototype._setDragMode = function() {
  var dragTags = arguments[0];
  if (dragTags.length == 0) {
    this._dragMode = {};
  } else {
    for (var i = 0; i < dragTags.length; ++i) {
      var dragMode = dragTags[i];
      this._dragMode[dragMode] = true;
    }
  }
};


// Changes the DragManager's state such that the current click shortcut behavior
// is keyed to the current hover/click element.
TMITHRIL_UTIL.DragManager.prototype._setupClickShortcut =
    function(evt, altTag, ctrlTag, shiftTag) {
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


TMITHRIL_UTIL.DragManager.prototype._inDragMode = function(key) {
  return key in this._dragMode;
};


TMITHRIL_UTIL.DragManager.prototype._isDragging = function() {
  return this._dragElementTree != null;
};


// Return whether or not a click shortcut key is pressed while hovering over
// a draggable element.
TMITHRIL_UTIL.DragManager.prototype._inKeyMode = function() {
  return this._keyMode;
};


TMITHRIL_UTIL.DragManager.prototype._clearDrag = function(forceClearInKeyMode) {
  if (this._inKeyMode() && !forceClearInKeyMode) {
    return;
  }
  document.body.removeEventListener('mousemove', this._bodyDragmove);
  this._dragData(null);
  this._setDragMode([]);  // dragMode takes array of keys.
  this._setCurrentTouchTarget(null);
  var dragImage = this._dragElementTree;
  if (dragImage) {
    dragImage.parentNode.removeChild(dragImage);
    this._dragElementTree = null;
  }

  window.removeEventListener('mouseup', this._clearDragWithRender, false);
  window.removeEventListener('blur', this._clearDragWithRender, false);
  document.removeEventListener(
      'visibilitychange', this._clearDragWithRender, false);
};


TMITHRIL_UTIL.DragManager.prototype._setCurrentTouchTarget = function() {
  var newTarget = arguments[0];
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
};
