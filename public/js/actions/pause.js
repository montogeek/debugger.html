"use strict";

const constants = require("../constants");
const { promisify } = require("../util/utils");
const { PROMISE } = require("ff-devtools-libs/client/shared/redux/middleware/promise");
const { selectSource } = require("./sources");

const CALL_STACK_PAGE_SIZE = 25;

/**
 * Debugger has just resumed
 */
function resumed() {
  return ({ dispatch, threadClient }) => {
    return dispatch({
      type: constants.RESUME,
      value: undefined
    });
  };
}

/**
 * Debugger has just paused
 */
function paused(pauseInfo) {
  return ({ dispatch, getState, threadClient }) => {
    // If paused by an explicit interrupt, which are generated by the
    // slow script dialog and internal events such as setting
    // breakpoints, ignore the event.
    const pause = pauseInfo.pause;
    if (pause.why.type === "interrupted" && !pause.why.onNext) {
      return;
    }

    dispatch(selectSource(pause.frame.location.sourceId));

    if (false) {
      dispatch({
        type: constants.LOAD_FRAMES,
        [PROMISE]: promisify(threadClient, threadClient.getFrames,
                             0, CALL_STACK_PAGE_SIZE)
      });
    } else {
      dispatch({
        type: constants.LOAD_FRAMES,
        status: "done",
        value: { frames: pauseInfo.frames }
      });
    }

    dispatch({
      type: constants.PAUSED,
      value: pause
    });
  };
}

/**
 * Debugger commands like stepOver, stepIn, stepUp
 */
function command({ type }) {
  return ({ dispatch, threadClient }) => {
    // execute debugger thread command e.g. stepIn, stepOver
    threadClient[type]();

    return dispatch({
      type: constants.COMMAND,
      value: undefined
    });
  };
}

/**
 * Debugger breakOnNext command.
 * It's different from the comand action because we also want to
 * highlight the pause icon.
 */
function breakOnNext() {
  return ({ dispatch, threadClient }) => {
    threadClient.breakOnNext();

    return dispatch({
      type: constants.BREAK_ON_NEXT,
      value: true
    });
  };
}

function selectFrame(frame) {
  return ({ dispatch }) => {
    dispatch(selectSource(frame.location.sourceId,
                          { line: frame.location.line }));
    dispatch({
      type: constants.SELECT_FRAME,
      frame: frame
    });
  };
}

module.exports = {
  resumed,
  paused,
  command,
  breakOnNext,
  selectFrame
};
