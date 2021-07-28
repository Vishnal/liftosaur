import { h, JSX, ComponentChildren } from "preact";
import { FooterView } from "./footer";
import { HeaderView } from "./header";
import { IDispatch } from "../ducks/types";
import { Thunk } from "../ducks/thunks";
import { ISettings, IUnit, ILengthUnit, IStats, IWeight, ILength, IStatsWeight, IStatsLength } from "../types";
import { Button } from "./button";
import { forwardRef, Ref, useRef, useState } from "preact/compat";
import { ObjectUtils } from "../utils/object";
import { Weight } from "../models/weight";
import { Length } from "../models/length";
import { ModalStats } from "./modalStats";
import { DateUtils } from "../utils/date";
import { EditStats } from "../models/editStats";
import { StringUtils } from "../utils/string";
import { ILoading } from "../models/state";

interface IProps {
  dispatch: IDispatch;
  settings: ISettings;
  stats: IStats;
  loading: ILoading;
}

export function ScreenStats(props: IProps): JSX.Element {
  const { statsEnabled, lengthUnits, units } = props.settings;
  const lastWeightStats = ObjectUtils.keys(props.stats.weight).reduce<Partial<Record<keyof IStatsWeight, IWeight>>>(
    (memo, key) => {
      const value = (props.stats.weight[key] || [])[0]?.value;
      if (value != null) {
        memo[key] = Weight.convertTo(value, props.settings.units);
      }
      return memo;
    },
    {}
  );
  const lastLengthStats = ObjectUtils.keys(props.stats.length).reduce<Partial<Record<keyof IStatsLength, ILength>>>(
    (memo, key) => {
      const value = (props.stats.length[key] || [])[0]?.value;
      if (value != null) {
        memo[key] = Length.convertTo(value, props.settings.lengthUnits);
      }
      return memo;
    },
    {}
  );
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);

  const refs = {
    weight: useRef<HTMLInputElement>(),
    neck: useRef<HTMLInputElement>(),
    shoulders: useRef<HTMLInputElement>(),
    bicepLeft: useRef<HTMLInputElement>(),
    bicepRight: useRef<HTMLInputElement>(),
    forearmLeft: useRef<HTMLInputElement>(),
    forearmRight: useRef<HTMLInputElement>(),
    chest: useRef<HTMLInputElement>(),
    waist: useRef<HTMLInputElement>(),
    hips: useRef<HTMLInputElement>(),
    thighLeft: useRef<HTMLInputElement>(),
    thighRight: useRef<HTMLInputElement>(),
    calfLeft: useRef<HTMLInputElement>(),
    calfRight: useRef<HTMLInputElement>(),
  };

  function saveWeight(): void {
    const payload = ObjectUtils.keys(statsEnabled.weight).reduce<Partial<Record<keyof IStatsWeight, IWeight>>>(
      (memo, key) => {
        const isEnabled = statsEnabled.weight[key];
        if (isEnabled) {
          const stringValue = refs[key]?.current.value;
          if (stringValue) {
            const value = parseFloat(stringValue);
            if (!isNaN(value)) {
              memo[key] = Weight.build(value, units);
            }
          }
        }
        return memo;
      },
      {}
    );
    EditStats.addWeightStats(props.dispatch, payload);
  }

  function saveLength(): void {
    const payload = ObjectUtils.keys(statsEnabled.length).reduce<Partial<Record<keyof IStatsLength, ILength>>>(
      (memo, key) => {
        const isEnabled = statsEnabled.length[key];
        if (isEnabled) {
          const stringValue = refs[key]?.current.value;
          if (stringValue) {
            const value = parseFloat(stringValue);
            if (!isNaN(value)) {
              memo[key] = Length.build(value, lengthUnits);
            }
          }
        }
        return memo;
      },
      {}
    );
    EditStats.addLengthStats(props.dispatch, payload);
  }

  function save(): void {
    saveWeight();
    saveLength();
    props.dispatch(Thunk.pullScreen());
  }

  return (
    <section className="h-full">
      <HeaderView
        subtitle="Record Stats"
        title={DateUtils.format(new Date())}
        left={<button onClick={() => props.dispatch(Thunk.pullScreen())}>Back</button>}
        right={
          <button className="ls-modify-stats" data-cy="modify-stats" onClick={() => setIsModalVisible(true)}>
            Modify
          </button>
        }
      />
      <section style={{ paddingTop: "3.5rem", paddingBottom: "4rem" }}>
        <p className="px-4 py-2 text-sm italic">
          All fields are optional, input only the fields you want this time. Empty fields won't be added.
        </p>
        {statsEnabled.weight && (
          <SingleLine>
            <Input ref={refs.weight} label="Bodyweight" value={lastWeightStats.weight?.value} unit={units} />
          </SingleLine>
        )}
        {statsEnabled.length.neck && (
          <SingleLine>
            <Input ref={refs.neck} label="Neck" value={lastLengthStats.neck?.value} unit={lengthUnits} />
          </SingleLine>
        )}
        {statsEnabled.length.shoulders && (
          <SingleLine>
            <Input ref={refs.shoulders} label="Shoulders" value={lastLengthStats.shoulders?.value} unit={lengthUnits} />
          </SingleLine>
        )}
        {(statsEnabled.length.bicepLeft || statsEnabled.length.bicepRight) && (
          <DoubleLine
            first={
              statsEnabled.length.bicepLeft && (
                <Input
                  ref={refs.bicepLeft}
                  label="Bicep Left"
                  value={lastLengthStats.bicepLeft?.value}
                  unit={lengthUnits}
                />
              )
            }
            second={
              statsEnabled.length.bicepRight && (
                <Input
                  ref={refs.bicepRight}
                  label="Bicep Right"
                  value={lastLengthStats.bicepRight?.value}
                  unit={lengthUnits}
                />
              )
            }
          />
        )}
        {(statsEnabled.length.forearmLeft || statsEnabled.length.forearmRight) && (
          <DoubleLine
            first={
              statsEnabled.length.forearmLeft && (
                <Input
                  ref={refs.forearmLeft}
                  label="Forearm Left"
                  value={lastLengthStats.forearmLeft?.value}
                  unit={lengthUnits}
                />
              )
            }
            second={
              statsEnabled.length.forearmRight && (
                <Input
                  ref={refs.forearmRight}
                  label="Forearm Right"
                  value={lastLengthStats.forearmRight?.value}
                  unit={lengthUnits}
                />
              )
            }
          />
        )}
        {statsEnabled.length.chest && (
          <SingleLine>
            <Input label="Chest" ref={refs.chest} value={lastLengthStats.chest?.value} unit={lengthUnits} />
          </SingleLine>
        )}
        {statsEnabled.length.waist && (
          <SingleLine>
            <Input ref={refs.waist} label="Waist" value={lastLengthStats.waist?.value} unit={lengthUnits} />
          </SingleLine>
        )}
        {statsEnabled.length.hips && (
          <SingleLine>
            <Input ref={refs.hips} label="Hips" value={lastLengthStats.hips?.value} unit={lengthUnits} />
          </SingleLine>
        )}
        {(statsEnabled.length.thighLeft || statsEnabled.length.thighRight) && (
          <DoubleLine
            first={
              statsEnabled.length.thighLeft && (
                <Input
                  ref={refs.thighLeft}
                  label="Thigh Left"
                  value={lastLengthStats.thighLeft?.value}
                  unit={lengthUnits}
                />
              )
            }
            second={
              statsEnabled.length.thighRight && (
                <Input
                  ref={refs.thighRight}
                  label="Thigh Right"
                  value={lastLengthStats.thighRight?.value}
                  unit={lengthUnits}
                />
              )
            }
          />
        )}
        {(statsEnabled.length.calfLeft || statsEnabled.length.calfRight) && (
          <DoubleLine
            first={
              statsEnabled.length.calfLeft && (
                <Input
                  ref={refs.calfLeft}
                  label="Calf Left"
                  value={lastLengthStats.calfLeft?.value}
                  unit={lengthUnits}
                />
              )
            }
            second={
              statsEnabled.length.calfRight && (
                <Input
                  ref={refs.calfRight}
                  label="Calf Right"
                  value={lastLengthStats.calfRight?.value}
                  unit={lengthUnits}
                />
              )
            }
          />
        )}
        <div className="mb-2 text-center">
          <Button tabIndex={1} className="ls-add-stats" data-cy="add-stats" kind="green" onClick={save}>
            Done
          </Button>
        </div>
      </section>
      <FooterView loading={props.loading} dispatch={props.dispatch} />
      {isModalVisible && (
        <ModalStats settings={props.settings} dispatch={props.dispatch} onClose={() => setIsModalVisible(false)} />
      )}
    </section>
  );
}

interface IInputProps {
  label: string;
  value?: number | string;
  unit: IUnit | ILengthUnit;
}

interface ISingleLineProps {
  children: ComponentChildren;
}

function SingleLine(props: ISingleLineProps): JSX.Element {
  return (
    <div className="my-2">
      <div className="w-32 mx-auto text-center">{props.children}</div>
    </div>
  );
}

interface IDoubleLineProps {
  first: ComponentChildren;
  second: ComponentChildren;
}

function DoubleLine(props: IDoubleLineProps): JSX.Element {
  return (
    <div className="flex my-2 text-center">
      <div className="flex-1 mx-3 text-center">{props.first}</div>
      <div className="flex-1 mx-3 text-center">{props.second}</div>
    </div>
  );
}

const Input = forwardRef(
  (props: IInputProps, ref: Ref<HTMLInputElement>): JSX.Element => {
    const name = StringUtils.dashcase(props.label.toLowerCase());
    return (
      <div className="inline-block w-full text-left">
        <label className="block text-sm italic">
          {props.label} ({props.unit})
        </label>
        <input
          data-cy={`input-stats-${name}`}
          tabIndex={1}
          className="focus:outline-none focus:shadow-outline w-full px-4 py-2 leading-normal bg-white border border-gray-300 rounded-lg appearance-none"
          value={props.value}
          ref={ref}
          type="number"
          placeholder="e.g. 10"
          min="0"
          step="0.01"
        />
      </div>
    );
  }
);
