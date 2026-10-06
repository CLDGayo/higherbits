import {
  $NOW,
  TimescapeManager,
  marry
} from "./chunk-53OHE264.js";

// src/integrations/react.ts
import {
  useEffect,
  useRef,
  useState,
  useLayoutEffect
} from "react";
var useTimescape = (options = {}) => {
  const { date, onChangeDate, ...rest } = options;
  const [manager] = useState(() => new TimescapeManager(date, rest));
  const onChangeDateRef = useRef(onChangeDate);
  useLayoutEffect(() => {
    onChangeDateRef.current = onChangeDate;
  }, [onChangeDate]);
  const [optionsState, update] = useState(() => ({
    date,
    ...rest
  }));
  useEffect(() => {
    manager.resync();
    return () => {
      manager.remove();
    };
  }, [manager]);
  useEffect(() => {
    return manager.on("changeDate", (nextDate) => {
      onChangeDateRef.current?.(nextDate);
      update((value) => ({ ...value, date: nextDate }));
    });
  }, [manager]);
  const timestamp = optionsState.date?.getTime();
  useEffect(() => {
    manager.date = timestamp;
    manager.minDate = optionsState.minDate;
    manager.maxDate = optionsState.maxDate;
    manager.hour12 = optionsState.hour12;
    manager.wrapAround = optionsState.wrapAround;
    manager.digits = optionsState.digits;
    manager.snapToStep = optionsState.snapToStep;
  }, [
    manager,
    timestamp,
    optionsState.minDate,
    optionsState.maxDate,
    optionsState.hour12,
    optionsState.wrapAround,
    optionsState.digits,
    optionsState.snapToStep
  ]);
  return {
    _manager: manager,
    getInputProps: (type, opts) => ({
      ref: (element) => {
        if (!element)
          return;
        manager.registerElement(element, type, opts?.autofocus);
        if (opts?.ref)
          opts.ref.current = element;
      }
    }),
    getRootProps: () => ({
      ref: (element) => element && manager.registerRoot(element)
    }),
    options: optionsState,
    update
  };
};
var useTimescapeRange = (options) => {
  const from = useTimescape(options.from);
  const to = useTimescape(options.to);
  useEffect(() => {
    marry(from._manager, to._manager);
  }, [from._manager, to._manager]);
  return {
    getRootProps: () => ({
      ref: (element) => {
        if (!element)
          return;
        from._manager.registerRoot(element);
        to._manager.registerRoot(element);
      }
    }),
    from: {
      getInputProps: from.getInputProps,
      options: from.options,
      update: from.update
    },
    to: {
      getInputProps: to.getInputProps,
      options: to.options,
      update: to.update
    }
  };
};
export {
  $NOW,
  useTimescape,
  useTimescapeRange
};
