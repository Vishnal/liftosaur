import * as React from "react";
import { TimeUtils } from "../utils/time";
import { useEffect, useRef, useState } from "react";

interface IProps {
  startTime: number;
}

export function Timer(props: IProps): JSX.Element {
  const intervalId = useRef<number | undefined>(undefined);
  const [tick, setTick] = useState<number>(0);

  useEffect(() => {
    if (intervalId != null) {
      window.clearInterval(intervalId.current);
    }
    intervalId.current = window.setInterval(() => {
      setTick(tick + 1);
    }, 1000);
    return () => {
      if (intervalId != null) {
        window.clearInterval(intervalId.current);
      }
    };
  });

  const timeDifference = Date.now() - props.startTime;
  return (
    <div className="px-3 py-1 italic text-right">
      <span>Time since start:</span> <strong>{TimeUtils.formatHHMM(timeDifference)}</strong>
    </div>
  );
}
