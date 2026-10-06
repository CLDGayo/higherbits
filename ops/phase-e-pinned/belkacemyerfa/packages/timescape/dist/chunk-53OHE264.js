var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
var __accessCheck = (obj, member, msg) => {
  if (!member.has(obj))
    throw TypeError("Cannot " + msg);
};
var __privateGet = (obj, member, getter) => {
  __accessCheck(obj, member, "read from private field");
  return getter ? getter.call(obj) : member.get(obj);
};
var __privateAdd = (obj, member, value) => {
  if (member.has(obj))
    throw TypeError("Cannot add the same private member more than once");
  member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
};
var __privateSet = (obj, member, value, setter) => {
  __accessCheck(obj, member, "write to private field");
  setter ? setter.call(obj, value) : member.set(obj, value);
  return value;
};
var __privateMethod = (obj, member, method) => {
  __accessCheck(obj, member, "access private method");
  return method;
};

// src/util.ts
var addElementListener = (node, type, listener, options) => {
  const typedListener = (ev) => listener(ev);
  node.addEventListener(type, typedListener, options);
  return () => node.removeEventListener(type, typedListener, options);
};
var isTouchDevice = () => "ontouchstart" in window || navigator.maxTouchPoints > 0 || // eslint-disable-next-line @typescript-eslint/no-explicit-any
navigator.msMaxTouchPoints > 0;
var STOP_EVENT_PROPAGATION = Symbol("STOP_EVENT_PROPAGATION");
var createPubSub = () => ({
  emit(event, data) {
    ;
    (this.events[event] || []).some(
      (cb) => cb(data) === STOP_EVENT_PROPAGATION
    );
  },
  events: {},
  on(event, cb) {
    this.events[event]?.push(cb) || (this.events[event] = [cb]);
    return () => {
      this.events[event] = this.events[event]?.filter((i) => cb !== i);
    };
  }
});

// src/date.ts
var isSameSeconds = (ts1, ts2) => Math.floor(ts1 / 1e3) === Math.floor(ts2 / 1e3);
var isLeapYear = (year) => year % 4 === 0 && year % 100 !== 0 || year % 400 === 0;
var daysInMonth = (date) => {
  const month = date.getMonth();
  const year = date.getFullYear();
  return new Date(year, month + 1, 0).getDate();
};
var add = (date, type, amount) => {
  const newDate = new Date(date);
  switch (type) {
    case "days":
      newDate.setDate(newDate.getDate() + amount);
      break;
    case "months":
      const dayOfMonth = newDate.getDate();
      newDate.setMonth(newDate.getMonth() + amount);
      if (newDate.getDate() !== dayOfMonth) {
        newDate.setDate(0);
      }
      break;
    case "years":
      const isLeapDay = newDate.getMonth() === 1 && newDate.getDate() === 29;
      newDate.setFullYear(newDate.getFullYear() + amount);
      if (isLeapDay && !isLeapYear(newDate.getFullYear())) {
        newDate.setMonth(1, 28);
      }
      break;
    case "hours":
      newDate.setHours(newDate.getHours() + amount);
      break;
    case "minutes":
      newDate.setMinutes(newDate.getMinutes() + amount);
      break;
    case "seconds":
      newDate.setSeconds(newDate.getSeconds() + amount);
      break;
  }
  return newDate;
};
var set = (date, type, value) => {
  const newDate = new Date(date);
  switch (type) {
    case "days":
      newDate.setDate(value);
      break;
    case "months":
      const currentDay = newDate.getDate();
      const daysInNewMonth = daysInMonth(new Date(newDate.getFullYear(), value));
      newDate.setDate(Math.min(currentDay, daysInNewMonth));
      newDate.setMonth(value);
      break;
    case "years":
      newDate.setFullYear(value);
      break;
    case "hours":
      newDate.setHours(value);
      break;
    case "minutes":
      newDate.setMinutes(value);
      break;
    case "seconds":
      newDate.setSeconds(value);
      break;
    case "am/pm":
      newDate.setHours(value);
      break;
  }
  return newDate;
};
var get = (date, type) => {
  switch (type) {
    case "days":
      return date.getDate();
    case "months":
      return date.getMonth();
    case "years":
      return date.getFullYear();
    case "hours":
      return date.getHours();
    case "minutes":
      return date.getMinutes();
    case "seconds":
      return date.getSeconds();
    case "am/pm":
      return date.getHours();
  }
};
var format = (date, type, hour12, digits = "2-digit") => {
  const digitCount = digits === "2-digit" ? 2 : 1;
  switch (type) {
    case "years":
      return String(date.getFullYear()).padStart(4, "0");
    case "months":
      return String(date.getMonth() + 1).padStart(digitCount, "0");
    case "days":
      return String(date.getDate()).padStart(digitCount, "0");
    case "hours":
      const hours = hour12 ? date.getHours() % 12 || 12 : date.getHours();
      return String(hours).padStart(digitCount, "0");
    case "minutes":
      return String(date.getMinutes()).padStart(2, "0");
    case "seconds":
      return String(date.getSeconds()).padStart(2, "0");
    case "am/pm":
      return date.getHours() < 12 ? "AM" : "PM";
  }
};

// src/range.ts
var marry = (from, to) => {
  from.on("focusWrap", (type) => {
    to.focusField(type === "start" ? -1 : 0);
  });
  from.on("changeDate", (date) => {
    if (!date || !to.date)
      return;
    if (date > to.date) {
      from.date = to.date;
      return STOP_EVENT_PROPAGATION;
    }
  });
  to.on("focusWrap", (type) => {
    from.focusField(type === "end" ? 0 : -1);
  });
  to.on("changeDate", (date) => {
    if (!date || !from.date)
      return;
    if (date < from.date) {
      to.date = from.date;
      return STOP_EVENT_PROPAGATION;
    }
  });
};

// src/index.ts
var $NOW = "$NOW";
var _instanceId, _timestamp, _registry, _pubsub, _rootElement, _rootListener, _cursorPosition, _resizeObserver, _mutationObserver, _copyStyles, _currentDate, currentDate_get, _getValue, getValue_fn, _wrapDateAround, wrapDateAround_fn, _clearIntermediateState, clearIntermediateState_fn, _handleKeyDown, handleKeyDown_fn, _handleClick, handleClick_fn, _handleFocus, handleFocus_fn, _handleBlur, handleBlur_fn, _sortRegistryByElements, sortRegistryByElements_fn, _syncAllElements, syncAllElements_fn, _syncElement, syncElement_fn, _createListeners, createListeners_fn, _setValidatedDate, setValidatedDate_fn, _focusNextField, focusNextField_fn;
var TimescapeManager = class {
  constructor(initialDate, options) {
    __privateAdd(this, _currentDate);
    __privateAdd(this, _getValue);
    __privateAdd(this, _wrapDateAround);
    __privateAdd(this, _clearIntermediateState);
    __privateAdd(this, _handleKeyDown);
    __privateAdd(this, _handleClick);
    __privateAdd(this, _handleFocus);
    __privateAdd(this, _handleBlur);
    // Because the order of insertion is important for which field is selected when tabbing,
    // we need to sort the registry by the order of the input elements in the DOM.
    __privateAdd(this, _sortRegistryByElements);
    __privateAdd(this, _syncAllElements);
    __privateAdd(this, _syncElement);
    __privateAdd(this, _createListeners);
    __privateAdd(this, _setValidatedDate);
    __privateAdd(this, _focusNextField);
    __publicField(this, "minDate");
    __publicField(this, "maxDate");
    __publicField(this, "hour12", false);
    __publicField(this, "digits", "2-digit");
    __publicField(this, "wrapAround", false);
    __publicField(this, "snapToStep", false);
    __privateAdd(this, _instanceId, Math.random().toString(36).slice(2));
    __privateAdd(this, _timestamp, void 0);
    __privateAdd(this, _registry, /* @__PURE__ */ new Map());
    __privateAdd(this, _pubsub, void 0);
    __privateAdd(this, _rootElement, void 0);
    __privateAdd(this, _rootListener, void 0);
    __privateAdd(this, _cursorPosition, 0);
    __privateAdd(this, _resizeObserver, typeof window !== "undefined" ? new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        const inputElement = [...__privateGet(this, _registry).values()].find(
          ({ shadowElement }) => shadowElement === entry.target
        )?.inputElement;
        if (!inputElement || !entry.contentBoxSize[0]?.inlineSize)
          return;
        inputElement.style.width = `${entry.contentBoxSize[0].inlineSize}px`;
      });
    }) : void 0);
    __privateAdd(this, _mutationObserver, typeof window !== "undefined" ? new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length > 0) {
          __privateMethod(this, _sortRegistryByElements, sortRegistryByElements_fn).call(this);
        }
        if (mutation.removedNodes.length > 0) {
          Array.from(mutation.removedNodes).filter((node) => node instanceof HTMLInputElement).forEach((node) => {
            const entry = [...__privateGet(this, _registry).values()].find(
              ({ inputElement }) => inputElement === node
            );
            if (!entry)
              return;
            entry.inputElement.remove();
            entry.shadowElement.remove();
            entry.listeners.forEach((listener) => listener());
            __privateGet(this, _registry).delete(entry.type);
          });
        }
      });
    }) : void 0);
    __privateAdd(this, _copyStyles, (from, to) => {
      const styles = [
        "fontFamily",
        "fontSize",
        "fontWeight",
        "fontStyle",
        "fontVariant",
        "letterSpacing",
        "textTransform",
        "textIndent",
        "textOrientation"
      ];
      requestAnimationFrame(() => {
        const computedStyles = window.getComputedStyle(from);
        for (const key of styles) {
          to.style[key] = computedStyles[key];
        }
      });
    });
    __privateSet(this, _timestamp, initialDate?.getTime());
    __privateSet(this, _pubsub, createPubSub());
    if (options) {
      this.minDate = options.minDate;
      this.maxDate = options.maxDate;
      this.hour12 = options.hour12;
      this.digits = options.digits;
      this.wrapAround = options.wrapAround;
    }
    return new Proxy(this, {
      get: (target, property) => {
        const original = target[property];
        if (typeof original === "function") {
          return (...args) => original.apply(target, args);
        } else {
          return original;
        }
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      set: (target, property, nextValue) => {
        var _a;
        switch (property) {
          case "minDate":
          case "maxDate":
            target[property] = nextValue;
            target.updateDate(__privateGet(target, _timestamp));
            break;
          case "hour12":
          case "digits":
            target[property] = nextValue;
            __privateMethod(_a = target, _syncAllElements, syncAllElements_fn).call(_a);
            break;
          default:
            target[property] = nextValue;
        }
        return true;
      }
    });
  }
  get date() {
    return __privateGet(this, _timestamp) ? new Date(__privateGet(this, _timestamp)) : void 0;
  }
  set date(nextDate) {
    this.updateDate(nextDate);
  }
  updateDate(timestamp) {
    __privateMethod(this, _setValidatedDate, setValidatedDate_fn).call(this, timestamp ? new Date(timestamp) : void 0);
  }
  resync() {
    var _a;
    if (__privateGet(this, _rootElement)) {
      (_a = __privateGet(this, _rootListener)) == null ? void 0 : _a.call(this);
      this.registerRoot(__privateGet(this, _rootElement));
    }
    Array.from(__privateGet(this, _registry)).forEach(([type, entry]) => {
      entry.listeners.forEach((listener) => listener());
      __privateGet(this, _registry).delete(type);
      this.registerElement(entry.inputElement, type, entry.autofocus, true);
    });
  }
  registerRoot(element) {
    element.tabIndex = -1;
    element.setAttribute("role", "group");
    __privateSet(this, _rootElement, element);
    const hasOtherRoot = element.dataset.timescapeInstance && element.dataset.timescapeInstance !== __privateGet(this, _instanceId);
    if (!hasOtherRoot)
      element.dataset.timescapeInstance = __privateGet(this, _instanceId);
    __privateSet(this, _rootListener, addElementListener(element, "focus", (e) => {
      if (hasOtherRoot)
        return;
      const activeField = element.querySelector("input[aria-selected]");
      if (activeField) {
        if (e.relatedTarget instanceof HTMLElement)
          e.relatedTarget.focus();
      } else {
        this.focusField(0);
      }
    }));
    __privateGet(this, _mutationObserver)?.observe(element, { childList: true, subtree: true });
  }
  registerElement(element, type, autofocus, domExists = false) {
    const registryEntry = __privateGet(this, _registry).get(type);
    if (!domExists && element === registryEntry?.inputElement) {
      return;
    }
    element.type = "text";
    element.readOnly = !isTouchDevice();
    element.tabIndex = 0;
    element.enterKeyHint = "next";
    element.spellcheck = false;
    element.autocapitalize = "off";
    element.setAttribute("role", "spinbutton");
    element.dataset.timescapeInput = "";
    if (autofocus) {
      requestAnimationFrame(() => element.focus());
    }
    if (type !== "am/pm") {
      element.inputMode = "numeric";
    }
    let shadowElement;
    const sibling = element.nextElementSibling;
    if (sibling instanceof HTMLSpanElement && sibling.dataset.timescapeShadow === type) {
      shadowElement = sibling;
    } else if (!domExists || !registryEntry?.shadowElement) {
      shadowElement = document.createElement("span");
      shadowElement.setAttribute("aria-hidden", "true");
      shadowElement.textContent = element.value || element.placeholder;
      shadowElement.dataset.timescapeShadow = type;
      shadowElement.style.cssText = `
      display: inline-block;
      position: absolute;
      left: -9999px;
      top: -9999px;
      visibility: hidden;
      pointer-events: none;
      white-space: pre;
      `;
      __privateGet(this, _copyStyles).call(this, element, shadowElement);
      __privateGet(this, _resizeObserver)?.observe(shadowElement);
      element.parentNode?.insertBefore(shadowElement, element.nextSibling);
    } else {
      shadowElement = registryEntry.shadowElement;
    }
    __privateGet(this, _registry).set(type, {
      type,
      inputElement: element,
      autofocus,
      shadowElement,
      intermediateValue: "",
      listeners: __privateMethod(this, _createListeners, createListeners_fn).call(this, element)
    });
    this.on("changeDate", () => __privateMethod(this, _syncElement, syncElement_fn).call(this, element));
    __privateMethod(this, _syncElement, syncElement_fn).call(this, element);
    return element;
  }
  remove() {
    var _a;
    (_a = __privateGet(this, _rootListener)) == null ? void 0 : _a.call(this);
    __privateGet(this, _registry).forEach(({ shadowElement, listeners }) => {
      listeners.forEach((remove) => remove());
      shadowElement.remove();
    });
    __privateGet(this, _pubsub).events = {};
    __privateGet(this, _resizeObserver)?.disconnect();
    __privateGet(this, _mutationObserver)?.disconnect();
  }
  focusField(which = 0) {
    const entries = [...__privateGet(this, _registry).values()];
    const type = typeof which === "number" ? entries.at(which)?.type : entries.find(({ type: type2 }) => type2 === which)?.type;
    type && __privateGet(this, _registry).get(type)?.inputElement.focus();
  }
  on(event, callback) {
    return __privateGet(this, _pubsub).on(event, callback);
  }
};
_instanceId = new WeakMap();
_timestamp = new WeakMap();
_registry = new WeakMap();
_pubsub = new WeakMap();
_rootElement = new WeakMap();
_rootListener = new WeakMap();
_cursorPosition = new WeakMap();
_resizeObserver = new WeakMap();
_mutationObserver = new WeakMap();
_copyStyles = new WeakMap();
_currentDate = new WeakSet();
currentDate_get = function() {
  return __privateGet(this, _timestamp) ? new Date(__privateGet(this, _timestamp)) : /* @__PURE__ */ new Date();
};
_getValue = new WeakSet();
getValue_fn = function(type) {
  const registryEntry = __privateGet(this, _registry).get(type);
  const intermediateValue = registryEntry?.intermediateValue;
  return intermediateValue ? type === "years" ? intermediateValue.padStart(4, "0") : intermediateValue.padStart(
    type === "minutes" || type === "seconds" ? 2 : this.digits === "2-digit" ? 2 : 1,
    "0"
  ) : __privateGet(this, _timestamp) !== void 0 ? format(__privateGet(this, _currentDate, currentDate_get), type, this.hour12, this.digits) : "";
};
_wrapDateAround = new WeakSet();
wrapDateAround_fn = function(step, type) {
  const ranges = {
    seconds: 60,
    minutes: 60,
    hours: this.hour12 ? 12 : 24,
    months: 12
  };
  let date = __privateGet(this, _currentDate, currentDate_get);
  if (type === "years" || type === "am/pm") {
    return add(date, "years", step);
  }
  if (type === "days") {
    const daysMonth = daysInMonth(date);
    const newValue = (date.getDate() + step - 1 + daysMonth) % daysMonth + 1;
    date.setDate(newValue);
  } else {
    const newValue = (get(date, type) + step + ranges[type]) % ranges[type];
    date = set(date, type, newValue);
  }
  return date;
};
_clearIntermediateState = new WeakSet();
clearIntermediateState_fn = function(registryEntry) {
  const { intermediateValue, type } = registryEntry;
  if (intermediateValue) {
    __privateMethod(this, _setValidatedDate, setValidatedDate_fn).call(this, set(
      __privateGet(this, _currentDate, currentDate_get),
      type,
      type === "months" ? Number(intermediateValue) - 1 : Number(intermediateValue)
    ));
    registryEntry.intermediateValue = "";
    __privateSet(this, _cursorPosition, 0);
  }
};
_handleKeyDown = new WeakSet();
handleKeyDown_fn = function(e) {
  const registryEntry = [...__privateGet(this, _registry).values()].find(
    ({ inputElement: inputElement2 }) => inputElement2 === e.target
  );
  if (!registryEntry)
    return;
  const { inputElement, intermediateValue, type } = registryEntry;
  switch (e.key) {
    case "ArrowUp":
    case "ArrowDown":
      __privateMethod(this, _clearIntermediateState, clearIntermediateState_fn).call(this, registryEntry);
      const date = __privateGet(this, _currentDate, currentDate_get);
      if (type === "am/pm") {
        const isAM = date.getHours() < 12;
        __privateMethod(this, _setValidatedDate, setValidatedDate_fn).call(this, add(date, "hours", isAM ? 12 : -12));
        break;
      }
      const elementStep = Number(inputElement.step) || 1;
      let step;
      if (this.snapToStep) {
        const value = get(date, type);
        if (e.key === "ArrowUp") {
          step = Math.ceil((value + 1) / elementStep) * elementStep - value;
        } else {
          step = Math.floor((value - 1) / elementStep) * elementStep - value;
        }
      } else {
        const factor = e.key === "ArrowUp" ? 1 : -1;
        step = elementStep * factor;
      }
      __privateMethod(this, _setValidatedDate, setValidatedDate_fn).call(this, this.wrapAround ? __privateMethod(this, _wrapDateAround, wrapDateAround_fn).call(this, step, type) : add(date, type, step));
      break;
    case "ArrowRight":
      __privateMethod(this, _focusNextField, focusNextField_fn).call(this, type);
      break;
    case "ArrowLeft":
      __privateMethod(this, _focusNextField, focusNextField_fn).call(this, type, -1);
      break;
    case "Backspace":
      break;
    default:
      const { key } = e;
      if (!/^\d$/.test(key))
        return;
      const number = Number(key);
      const setIntermediateValue = (value) => {
        registryEntry.intermediateValue = value;
        __privateMethod(this, _syncElement, syncElement_fn).call(this, inputElement);
      };
      const setValue = (unit, value) => {
        const newDate = set(__privateGet(this, _currentDate, currentDate_get), unit, value);
        registryEntry.intermediateValue = "";
        __privateMethod(this, _setValidatedDate, setValidatedDate_fn).call(this, newDate);
        __privateMethod(this, _syncElement, syncElement_fn).call(this, inputElement);
        __privateSet(this, _cursorPosition, 0);
      };
      switch (type) {
        case "days":
          if (__privateGet(this, _cursorPosition) === 0) {
            setIntermediateValue(key);
            if (number > 3) {
              setValue("days", number);
              __privateMethod(this, _focusNextField, focusNextField_fn).call(this, type);
            } else {
              __privateSet(this, _cursorPosition, 1);
            }
          } else {
            const finalValue = Math.max(
              1,
              Math.min(
                Number(intermediateValue + key),
                daysInMonth(__privateGet(this, _currentDate, currentDate_get))
              )
            );
            setValue("days", finalValue);
            __privateMethod(this, _focusNextField, focusNextField_fn).call(this, type);
          }
          break;
        case "months":
          if (__privateGet(this, _cursorPosition) === 0) {
            setIntermediateValue(key);
            if (number > 1) {
              setValue("months", number - 1);
              __privateMethod(this, _focusNextField, focusNextField_fn).call(this, type);
            } else {
              __privateSet(this, _cursorPosition, 1);
            }
          } else {
            const finalValue = Math.max(
              0,
              // Subtract 1 because JS months are 0-based
              // Prevent negative so years are not wrapped around
              Math.min(Number(intermediateValue + key), 12) - 1
            );
            setValue("months", finalValue);
            __privateMethod(this, _focusNextField, focusNextField_fn).call(this, type);
          }
          break;
        case "years":
          if (__privateGet(this, _cursorPosition) < 4) {
            const newValue = intermediateValue + key;
            setIntermediateValue(newValue);
            __privateSet(this, _cursorPosition, __privateGet(this, _cursorPosition) + 1);
            if (__privateGet(this, _cursorPosition) === 4) {
              setValue("years", Number(newValue));
              __privateMethod(this, _focusNextField, focusNextField_fn).call(this, type);
            }
          }
          break;
        case "hours":
          if (__privateGet(this, _cursorPosition) === 0) {
            setIntermediateValue(key);
            const maxFirstDigit = this.hour12 ? 1 : 2;
            if (number > maxFirstDigit) {
              setValue("hours", number);
              __privateMethod(this, _focusNextField, focusNextField_fn).call(this, type);
            } else {
              __privateSet(this, _cursorPosition, 1);
            }
          } else {
            const finalValue = Number(intermediateValue + key);
            const maxAvailableHours = this.hour12 ? 12 : 24;
            setValue(
              "hours",
              finalValue > maxAvailableHours ? number : finalValue
            );
            __privateMethod(this, _focusNextField, focusNextField_fn).call(this, type);
          }
          break;
        case "minutes":
        case "seconds":
          if (__privateGet(this, _cursorPosition) === 0) {
            setIntermediateValue(key);
            if (number > 5) {
              setValue(type, number);
              __privateMethod(this, _focusNextField, focusNextField_fn).call(this, type);
            } else {
              __privateSet(this, _cursorPosition, 1);
            }
          } else {
            const finalValue = Math.min(Number(intermediateValue + key), 59);
            setValue(type, finalValue);
            __privateMethod(this, _focusNextField, focusNextField_fn).call(this, type, 1, false);
          }
          break;
      }
      break;
  }
  e.preventDefault();
  e.stopPropagation();
};
_handleClick = new WeakSet();
handleClick_fn = function(e) {
  const target = e.target;
  target.focus();
};
_handleFocus = new WeakSet();
handleFocus_fn = function(e) {
  const target = e.target;
  target.setAttribute("aria-selected", "true");
  __privateSet(this, _cursorPosition, 0);
};
_handleBlur = new WeakSet();
handleBlur_fn = function(e) {
  requestAnimationFrame(() => {
    if (e.target !== document.activeElement) {
      const registryEntry = [...__privateGet(this, _registry).values()].find(
        ({ inputElement }) => inputElement === e.target
      );
      if (registryEntry) {
        __privateMethod(this, _clearIntermediateState, clearIntermediateState_fn).call(this, registryEntry);
      }
      const target = e.target;
      target.removeAttribute("aria-selected");
    }
  });
};
_sortRegistryByElements = new WeakSet();
sortRegistryByElements_fn = function() {
  __privateSet(this, _registry, new Map(
    [...__privateGet(this, _registry).entries()].sort(([, a], [, b]) => {
      const position = a.inputElement.compareDocumentPosition(b.inputElement);
      return position & Node.DOCUMENT_POSITION_FOLLOWING || position & Node.DOCUMENT_POSITION_CONTAINED_BY ? -1 : 1;
    })
  ));
};
_syncAllElements = new WeakSet();
syncAllElements_fn = function() {
  __privateGet(this, _registry).forEach((entry) => __privateMethod(this, _syncElement, syncElement_fn).call(this, entry.inputElement));
};
_syncElement = new WeakSet();
syncElement_fn = function(element) {
  const entry = [...__privateGet(this, _registry).values()].find(
    ({ inputElement }) => inputElement === element
  );
  if (!entry)
    return;
  const { type, shadowElement } = entry;
  const value = __privateMethod(this, _getValue, getValue_fn).call(this, type);
  if (element.value === value)
    return;
  element.value = value;
  element.setAttribute("aria-label", type);
  if (type !== "am/pm") {
    element.setAttribute("aria-valuenow", value.replace(/^0/, ""));
    element.setAttribute(
      "aria-valuemin",
      ["days", "months", "years"].includes(type) ? "1" : "0"
    );
    element.setAttribute(
      "aria-valuemax",
      (type === "days" ? daysInMonth(__privateGet(this, _currentDate, currentDate_get)) : type === "months" ? 12 : type === "years" ? 9999 : type === "hours" ? 23 : type === "minutes" || type === "seconds" ? 59 : "").toString()
    );
  }
  if (shadowElement.textContent !== value) {
    shadowElement.textContent = value || element.placeholder;
  }
};
_createListeners = new WeakSet();
createListeners_fn = function(element) {
  return [
    addElementListener(element, "keydown", (e) => __privateMethod(this, _handleKeyDown, handleKeyDown_fn).call(this, e)),
    addElementListener(element, "click", (e) => __privateMethod(this, _handleClick, handleClick_fn).call(this, e)),
    addElementListener(element, "focus", (e) => __privateMethod(this, _handleFocus, handleFocus_fn).call(this, e)),
    addElementListener(element, "focusout", (e) => __privateMethod(this, _handleBlur, handleBlur_fn).call(this, e))
  ];
};
_setValidatedDate = new WeakSet();
setValidatedDate_fn = function(date) {
  if (!date) {
    __privateSet(this, _timestamp, void 0);
    __privateGet(this, _pubsub).emit("changeDate", void 0);
    return;
  }
  const minDate = this.minDate === $NOW ? /* @__PURE__ */ new Date() : this.minDate;
  const maxDate = this.maxDate === $NOW ? /* @__PURE__ */ new Date() : this.maxDate;
  if (minDate && date < minDate) {
    date = minDate;
  } else if (maxDate && date > maxDate) {
    date = maxDate;
  }
  if (__privateGet(this, _timestamp) && isSameSeconds(date.getTime(), __privateGet(this, _timestamp))) {
    return;
  }
  __privateSet(this, _timestamp, date.getTime());
  __privateGet(this, _pubsub).emit("changeDate", date);
};
_focusNextField = new WeakSet();
focusNextField_fn = function(type, offset = 1, wrap = true) {
  const types = [...__privateGet(this, _registry).keys()];
  const index = types.indexOf(type);
  const nextIndex = wrap ? types[(index + offset + types.length) % types.length] : types[index + offset];
  if (nextIndex)
    __privateGet(this, _registry).get(nextIndex)?.inputElement.focus();
  if (wrap && (index === 0 && offset <= -1 || index === types.length - 1 && offset >= 1)) {
    __privateGet(this, _pubsub).emit("focusWrap", offset === -1 ? "start" : "end");
  }
};
var src_default = TimescapeManager;

export {
  marry,
  $NOW,
  TimescapeManager,
  src_default
};
