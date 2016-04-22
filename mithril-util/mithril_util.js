var TMITHRIL_UTIL = {};


function mT(tagName) {
  return new TMITHRIL_UTIL.Element(tagName);
}


TMITHRIL_UTIL.Element = function(tagName) {
  this.tag = tagName;
  this.attrs = {};
  this._tm_configs = [];
  this._tm_mouseovers = [];
  this._tm_mouseouts = [];
  this._tm_mouseups = [];
};

TMITHRIL_UTIL.Element.prototype = new Object();
TMITHRIL_UTIL.Element.prototype.constructor = TMITHRIL_UTIL.Element;

TMITHRIL_UTIL.Element.prototype._initChildren = function() {
  if (this.children == undefined) {
    this.children = [];
  }
}

TMITHRIL_UTIL.Element.prototype.num_children = function() {
  if (this.children == undefined) {
    return 0;
  }
  return this.children.length;
}

TMITHRIL_UTIL.Element.prototype.mkey = function(mkey) {
  this.attrs['key'] = mkey;
  return this;
};

TMITHRIL_UTIL.Element.prototype.attr = function(key, value) {
  this.attrs[key] = value;
  return this;
};

TMITHRIL_UTIL.Element.prototype.blur = function(onBlur) {
  this.attrs['onblur'] = onBlur;
  return this;
};

TMITHRIL_UTIL.Element.prototype.change = function(onChange) {
  this.attrs['onchange'] = onChange;
  return this;
};

TMITHRIL_UTIL.Element.prototype.click = function(onClick) {
  this.attrs['onclick'] = onClick;
  return this;
};

TMITHRIL_UTIL.Element.prototype.config = function(config) {
  this._tm_configs.push(config);
  if (this.attrs['config'] == null) {
    this.attrs['config'] = function(element, isInitialized, context) {
      for (var i = 0; i < this._tm_configs.length; ++i) {
        this._tm_configs[i](element, isInitialized, context);
      }
    }.bind(this);
  }
  return this;
};

TMITHRIL_UTIL.Element.prototype.dragstart = function(onDragStart) {
  this.attrs['ondragstart'] = onDragStart;
  return this;
};

TMITHRIL_UTIL.Element.prototype.dragenter = function(onDragEnter) {
  this.attrs['ondragenter'] = onDragEnter;
  return this;
};

TMITHRIL_UTIL.Element.prototype.dragover = function(onDragOver) {
  this.attrs['ondragover'] = onDragOver;
  return this;
};

TMITHRIL_UTIL.Element.prototype.dragleave = function(onDragLeave) {
  this.attrs['ondragleave'] = onDragLeave;
  return this;
};

TMITHRIL_UTIL.Element.prototype.drop = function(onDrop) {
  this.attrs['ondrop'] = onDrop;
  return this;
};

TMITHRIL_UTIL.Element.prototype.input = function(onInput) {
  this.attrs['oninput'] = onInput;
  return this;
};

TMITHRIL_UTIL.Element.prototype.keydown = function(onKeyDown) {
  this.attrs['onkeydown'] = onKeyDown;
  return this;
};

TMITHRIL_UTIL.Element.prototype.keyup = function(onKeyUp) {
  this.attrs['onkeyup'] = onKeyUp;
  return this;
};

TMITHRIL_UTIL.Element.prototype.mousedown = function(onMouseDown) {
  this.attrs['onmousedown'] = onMouseDown;
  return this;
};

TMITHRIL_UTIL.Element.prototype.mousemove = function(onMouseMove) {
  this.attrs['onmousemove'] = onMouseMove;
  return this;
};

TMITHRIL_UTIL.Element.prototype.mouseover = function(onMouseOver) {
  this._tm_mouseovers.push(onMouseOver);
  if (this.attrs['onmouseover'] == null) {
    this.attrs['onmouseover'] = function(evt) {
      for (var i = 0; i < this._tm_mouseovers.length; ++i) {
        this._tm_mouseovers[i](evt);
      }
    }.bind(this);
  }
  return this;
};

TMITHRIL_UTIL.Element.prototype.mouseout = function(onMouseOut) {
  this._tm_mouseouts.push(onMouseOut);
  if (this.attrs['onmouseout'] == null) {
    this.attrs['onmouseout'] = function(evt) {
      for (var i = 0; i < this._tm_mouseouts.length; ++i) {
        this._tm_mouseouts[i](evt);
      }
    }.bind(this);
  }
  return this;
};

TMITHRIL_UTIL.Element.prototype.mouseup = function(onMouseuUp) {
  this._tm_mouseups.push(onMouseuUp);
  if (this.attrs['onmouseup'] == null) {
    this.attrs['onmouseup'] = function(evt) {
      for (var i = 0; i < this._tm_mouseups.length; ++i) {
        this._tm_mouseups[i](evt);
      }
    }.bind(this);
  }
  return this;
};

TMITHRIL_UTIL.Element.prototype.submit = function(onSubmit) {
  this.attrs['onsubmit'] = onSubmit;
  return this;
};

TMITHRIL_UTIL.Element.prototype.touchcancel = function(onTouchCancel) {
  this.config(function(element, isInitialized, context) {
    if (isInitialized) { return; }
    element.addEventListener('touchcancel', onTouchCancel, false);
  });
  return this;
};

TMITHRIL_UTIL.Element.prototype.touchend = function(onTouchEnd) {
  this.config(function(element, isInitialized, context) {
    if (isInitialized) { return; }
    element.addEventListener('touchend', onTouchEnd, false);
  });
  return this;
};

// OnTouchLeave is NOT A THING
TMITHRIL_UTIL.Element.prototype.touchleave = function(onTouchLeave) {
  this.config(function(element, isInitialized, context) {
    if (isInitialized) { return; }
    element.addEventListener('touchleave', onTouchLeave, false);
  });
  return this;
};

TMITHRIL_UTIL.Element.prototype.touchmove = function(onTouchMove) {
  this.config(function(element, isInitialized, context) {
    if (isInitialized) { return; }
    element.addEventListener('touchmove', onTouchMove, false);
  });
  return this;
};

TMITHRIL_UTIL.Element.prototype.touchstart = function(onTouchStart) {
  this.config(function(element, isInitialized, context) {
    if (isInitialized) { return; }
    element.addEventListener('touchstart', onTouchStart, false);
  });
  return this;
};


TMITHRIL_UTIL.Element.prototype.key = function(key) {
  this.attrs['key'] = key;
  return this;
};

TMITHRIL_UTIL.Element.prototype.addClass = function(className) {
  var origClass = this.attrs['class'];
  if (origClass == undefined) {
    this.attrs['class'] = className;
  } else {
    this.attrs.class = origClass + ' ' + className;
  }
  return this;
};

TMITHRIL_UTIL.Element.prototype.removeClass = function(className) {
  var oldValue = this.attrs.class;
  if (oldValue != undefined) {
    var re = new RegExp('\\b' + className + '\\b', 'g');
    this.attrs.class = oldValue.replace(re, '');
  }
};

TMITHRIL_UTIL.Element.prototype.appendTo = function(parentElement) {
  parentElement.append(this);
  return this;
};

TMITHRIL_UTIL.Element.prototype.append = function(child) {
  this._initChildren();
  this.children.push(child);
  return this;
};

TMITHRIL_UTIL.Element.prototype.text = function(text) {
  if (typeof text !== 'string' && typeof text !== 'number') {
    console.log('Non-string, non-number argument to text(): ' + text);
  }
  if (text) {
    this.children = text;
  }
  return this;
};
