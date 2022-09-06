import * as React from "react";
import { memo } from "react";
import { inputClassName } from "../../../components/input";
import { Weight } from "../../../models/weight";
import { IProgramState, ISettings, IWeight } from "../../../types";
import { ObjectUtils } from "../../../utils/object";

interface IStateVarsProps {
  id: string;
  stateVars: IProgramState;
  settings: ISettings;
  onChange: (key: string, value: number | IWeight) => void;
}

export const StateVars = memo((props: IStateVarsProps): JSX.Element | null => {
  const { id, stateVars } = props;
  if (Object.keys(stateVars).length === 0) {
    return null;
  }
  const varEls = ObjectUtils.keys(stateVars).map((key) => {
    const variable = stateVars[key];
    const name = `${id}_${key}`;
    const val = typeof variable === "number" ? variable : variable.value;
    return (
      <li className="flex items-center pb-2">
        <label className="pr-2 font-bold" htmlFor={name}>
          {key}
        </label>
        <input
          className={inputClassName}
          id={name}
          name={name}
          type="number"
          value={val}
          onInput={(e) => {
            const newValStr = (e.target as HTMLInputElement).value;
            const newVal = newValStr ? parseInt(newValStr, 10) : undefined;
            if (newVal != null && !isNaN(newVal)) {
              const newValue = typeof variable === "number" ? newVal : Weight.build(newVal, variable.unit);
              props.onChange(key, newValue);
            }
          }}
        />
        <span className="pl-1">{typeof variable !== "number" ? variable.unit : ""}</span>
      </li>
    );
  });
  return (
    <div className="flex justify-start">
      <div style={{ width: "10em" }}>
        <h4 className="text-sm italic">State variables:</h4>
        <ul>{varEls}</ul>
      </div>
    </div>
  );
});
