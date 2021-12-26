let MITHRIL_UTIL = {};


// Routing help

MITHRIL_UTIL._routerParams = {};
muRoute = function(url, params) {
  if (!params) {
    params = {};
  }
  MITHRIL_UTIL._routerParams = params;
  m.route(url);
}

muGetAndClearParams = function() {
  let params = MITHRIL_UTIL._routerParams;
  MITHRIL_UTIL._routerParams = {};
  return params;
}

let softRoute = function(path) {
  if (window.location.pathname !== path) {
    window.history.pushState({}, "", path);
  }
};


// View construction help

function mu(tagName) {
  return new MITHRIL_UTIL.Element(tagName);
}

MITHRIL_UTIL.Element = function(tagName) {
  this.tag = tagName;
  this.attrs = {};
  this.children = [];
  this._tm_configs = {};
  this._tm_mouseovers = [];
  this._tm_mouseouts = [];
  this._tm_mouseenters = [];
  this._tm_mouseleaves = [];
  this._tm_mouseups = [];
};

MITHRIL_UTIL.Element.prototype = new Object();
MITHRIL_UTIL.Element.prototype.constructor = MITHRIL_UTIL.Element;

MITHRIL_UTIL.Element.prototype._initChildren = function() {
  if (!this.children) {
    this.children = [];
  }
}

MITHRIL_UTIL.Element.prototype.num_children = function() {
  if (!this.children) {
    return 0;
  }
  return this.children.length;
}

MITHRIL_UTIL.Element.prototype.mkey = function(mkey) {
  this.attrs['key'] = mkey;
  return this;
};

MITHRIL_UTIL.Element.prototype.attr = function(key, value) {
  this.attrs[key] = value;
  return this;
};

MITHRIL_UTIL.Element.prototype.attrIf = function(condition, key, value) {
  if (condition) {
    this.attrs[key] = value;
  }
  return this;
};

MITHRIL_UTIL.Element.prototype.blur = function(onBlur) {
  this.attrs['onblur'] = onBlur;
  return this;
};

MITHRIL_UTIL.Element.prototype.change = function(onChange) {
  this.attrs['onchange'] = onChange;
  return this;
};

MITHRIL_UTIL.Element.prototype.click = function(onClick) {
  this.attrs['onclick'] = onClick;
  return this;
};

MITHRIL_UTIL.Element.prototype.config = function(eventType, config) {
    if (!(eventType in this._tm_configs)) {
        this._tm_configs[eventType] = [];
    }

  this._tm_configs[eventType].push(config);
  if (this.attrs['on' + eventType]) {
      return this;
  }

  this.attrs['on' + eventType] = evt => {
    for (let i = 0; i < this._tm_configs[eventType].length; ++i) {
      this._tm_configs[eventType][i](evt);
    }
  };
  return this;
};

MITHRIL_UTIL.Element.prototype.dragstart = function(onDragStart) {
  this.attrs['ondragstart'] = onDragStart;
  return this;
};

MITHRIL_UTIL.Element.prototype.dragenter = function(onDragEnter) {
  this.attrs['ondragenter'] = onDragEnter;
  return this;
};

MITHRIL_UTIL.Element.prototype.dragover = function(onDragOver) {
  this.attrs['ondragover'] = onDragOver;
  return this;
};

MITHRIL_UTIL.Element.prototype.dragleave = function(onDragLeave) {
  this.attrs['ondragleave'] = onDragLeave;
  return this;
};

MITHRIL_UTIL.Element.prototype.drop = function(onDrop) {
  this.attrs['ondrop'] = onDrop;
  return this;
};

MITHRIL_UTIL.Element.prototype.input = function(onInput) {
  this.attrs['oninput'] = onInput;
  return this;
};

MITHRIL_UTIL.Element.prototype.keydown = function(onKeyDown) {
  this.attrs['onkeydown'] = onKeyDown;
  return this;
};

MITHRIL_UTIL.Element.prototype.keyup = function(onKeyUp) {
  this.attrs['onkeyup'] = onKeyUp;
  return this;
};

MITHRIL_UTIL.Element.prototype.mousedown = function(onMouseDown) {
  this.attrs['onmousedown'] = onMouseDown;
  return this;
};

MITHRIL_UTIL.Element.prototype.mousemove = function(onMouseMove) {
  this.attrs['onmousemove'] = onMouseMove;
  return this;
};

MITHRIL_UTIL.Element.prototype.mouseover = function(onMouseOver) {
  this._tm_mouseovers.push(onMouseOver);
  if (!this.attrs['onmouseover']) {
    this.attrs['onmouseover'] = function(evt) {
      for (let i = 0; i < this._tm_mouseovers.length; ++i) {
        this._tm_mouseovers[i](evt);
      }
    }.bind(this);
  }
  return this;
};

MITHRIL_UTIL.Element.prototype.mouseout = function(onMouseOut) {
  this._tm_mouseouts.push(onMouseOut);
  if (!this.attrs['onmouseout']) {
    this.attrs['onmouseout'] = function(evt) {
      for (let i = 0; i < this._tm_mouseouts.length; ++i) {
        this._tm_mouseouts[i](evt);
      }
    }.bind(this);
  }
  return this;
};

MITHRIL_UTIL.Element.prototype.mouseenter = function(onMouseEnter) {
  this._tm_mouseenters.push(onMouseEnter);
  if (!this.attrs['onmouseenter']) {
    this.attrs['onmouseenter'] = function(evt) {
      for (let i = 0; i < this._tm_mouseenters.length; ++i) {
        this._tm_mouseenters[i](evt);
      }
    }.bind(this);
  }
  return this;
};

MITHRIL_UTIL.Element.prototype.mouseleave = function(onMouseLeave) {
  this._tm_mouseleaves.push(onMouseLeave);
  if (!this.attrs['onmouseleave']) {
    this.attrs['onmouseleave'] = function(evt) {
      for (let i = 0; i < this._tm_mouseleaves.length; ++i) {
        this._tm_mouseleaves[i](evt);
      }
    }.bind(this);
  }
  return this;
};

MITHRIL_UTIL.Element.prototype.mouseup = function(onMouseuUp) {
  this._tm_mouseups.push(onMouseuUp);
  if (!this.attrs['onmouseup']) {
    this.attrs['onmouseup'] = function(evt) {
      for (let i = 0; i < this._tm_mouseups.length; ++i) {
        this._tm_mouseups[i](evt);
      }
    }.bind(this);
  }
  return this;
};

MITHRIL_UTIL.Element.prototype.submit = function(onSubmit) {
  this.attrs['onsubmit'] = onSubmit;
  return this;
};

MITHRIL_UTIL.Element.prototype.touchcancel = function(onTouchCancel) {
  this.config('touchcancel', onTouchCancel);
  return this;
};

MITHRIL_UTIL.Element.prototype.touchend = function(onTouchEnd) {
  this.config('touchend', onTouchEnd);
  return this;
};

// OnTouchLeave is NOT A THING
MITHRIL_UTIL.Element.prototype.touchleave = function(onTouchLeave) {
  this.config('touchleave', onTouchLeave);
  return this;
};

MITHRIL_UTIL.Element.prototype.touchmove = function(onTouchMove) {
  this.config('touchmove', onTouchMove);
  return this;
};

MITHRIL_UTIL.Element.prototype.touchstart = function(onTouchStart) {
  this.config('touchstart', onTouchStart);
  return this;
};


MITHRIL_UTIL.Element.prototype.key = function(key) {
  this.attrs['key'] = key;
  return this;
};

MITHRIL_UTIL.Element.prototype.addClass = function(className) {
  let origClass = this.attrs['class'];
  if (!origClass) {
    this.attrs['class'] = className;
  } else {
    this.attrs.class = origClass + ' ' + className;
  }
  return this;
};

MITHRIL_UTIL.Element.prototype.addClassIf = function(condition, className) {
  if (!condition) {
      return this;
  }
  let origClass = this.attrs['class'];
  if (!origClass) {
    this.attrs['class'] = className;
  } else {
    this.attrs.class = origClass + ' ' + className;
  }
  return this;
};

// DEPRECATED. This function makes no sense in a mithril-style engine.
MITHRIL_UTIL.Element.prototype.removeClass = function(className) {
  let oldValue = this.attrs.class;
  if (oldValue !== undefined) {
    let re = new RegExp('\\b' + className + '\\b', 'g');
    this.attrs.class = oldValue.replace(re, '');
  }
};

MITHRIL_UTIL.Element.prototype.style = function(attribute, value) {
  let style = {};
  if ('style' in this.attrs) {
      style = this.attrs.style;
  }
  style[attribute] = value;
  this.attrs.style = style;
  return this;
};

MITHRIL_UTIL.Element.prototype.appendTo = function(parentElement) {
  parentElement.append(this);
  return this;
};

MITHRIL_UTIL.Element.prototype.append = function(child) {
  if (this.text) {
      console.log(`mu warning: element "${this.tag}" cannot have both text and child elements`);
  }

  this._initChildren();
  this.children.push(child);
  return this;
};

MITHRIL_UTIL.Element.prototype.appendList = function(children) {
    for (let i = 0; i < children.length; ++i) {
        this.append(children[i]);
    }
    return this;
};

MITHRIL_UTIL.Element.prototype.appendIf = function(condition, child) {
  if (condition) {
      this._initChildren();
      this.children.push(child);
  }
  return this;
};

MITHRIL_UTIL.Element.prototype.map = function(elements, func) {
    for (let i = 0; i < elements.length; ++i) {
        let item = func(elements[i]);
        this.append(item);
    }
    return this;
}

MITHRIL_UTIL.Element.prototype.setText = function(text) {
  if (this.children.length > 0) {
      console.log(`mu warning: element "${this.tag}" cannot have both text and child elements`);
  }
  if (typeof text === 'number') {
    text = '' + text;
  }
  if (typeof text === 'string') {
    if (text !== '') {
      this.text = text;
    } else {
      console.log('mu warning: Using empty string in mithril_util text().');
    }
  } else {
    this.text = 'mithril_util error';
    console.log('mu warning: Non-string, non-number argument to text(): "' + text + '"');
  }
  return this;
};

MITHRIL_UTIL.Element.prototype.runIf = function(condition, func) {
    if (condition) {
        func(this);
    }
    return this;
};
