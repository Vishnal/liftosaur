import * as React from "react";
import { ObjectUtils } from "../utils/object";
import { IDispatch } from "../ducks/types";
import { DateUtils } from "../utils/date";
import { IState, updateState } from "./state";
import { lb } from "lens-shmens";

export interface IWhatsNew {
  title: JSX.Element;
  body: JSX.Element;
}

const whatsNew: Record<string, IWhatsNew> = {
  "20220219": {
    title: <span>Import/Export of all data and also specific programs.</span>,
    body: (
      <ul>
        <li>You can now export all your data into a file (history, settings, etc), and then import it later on.</li>
        <li>
          Also can export and import programs. Could use it to e.g. share a workout program with a friend, or as a
          backup, or for some other reason.
        </li>
      </ul>
    ),
  },
  "20220604": {
    title: <span>Add 1 Rep Max line to the exercises graphs.</span>,
    body: (
      <ul>
        <li>
          It better shows the progress trend, since it combines weight and reps into one value. We use{" "}
          <a href="https://en.wikipedia.org/wiki/One-repetition_maximum">Epley formula</a> to calculate it. It's enabled
          by default, but you can disable it in settings on Graphs screen.
        </li>
      </ul>
    ),
  },
  "20220808": {
    title: <span>Big changes in the equipment settings.</span>,
    body: (
      <ul>
        <li>You can now specify plates separately for each equipment type - barbell, dumbbell, cable, etc.</li>
        <li>
          Each equipment type now supports "fixed" weights, without plates, e.g. if you use fixed weight dumbbells.
        </li>
      </ul>
    ),
  },
};

export namespace WhatsNew {
  export function all(): typeof whatsNew {
    return whatsNew;
  }

  export function doesHaveNewUpdates(lastDateStr?: string): boolean {
    if (lastDateStr == null) {
      return false;
    } else {
      return Object.keys(newUpdates(lastDateStr)).length > 0;
    }
  }

  export function newUpdates(lastDateStr: string): Record<string, IWhatsNew> {
    const lastDate = parseInt(lastDateStr, 10);
    return ObjectUtils.keys(whatsNew).reduce<Record<string, IWhatsNew>>((memo, dateStr) => {
      const date = parseInt(dateStr, 10);
      if (date > lastDate) {
        memo[dateStr] = whatsNew[dateStr];
      }
      return memo;
    }, {});
  }

  export function updateStorage(dispatch: IDispatch): void {
    updateState(dispatch, [
      lb<IState>().p("storage").p("whatsNew").record(DateUtils.formatYYYYMMDD(Date.now(), "")),
      lb<IState>().p("showWhatsNew").record(false),
    ]);
  }

  export function showWhatsNew(dispatch: IDispatch): void {
    updateState(dispatch, [lb<IState>().p("showWhatsNew").record(true)]);
  }
}
