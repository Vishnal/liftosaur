import { h, JSX } from "preact";
import { FooterView } from "./footer";
import { HeaderView } from "./header";
import { IDispatch } from "../ducks/types";
import { Weight } from "../models/weight";
import { MenuItemEditable } from "./menuItemEditable";
import { Button } from "./button";
import { useState } from "preact/hooks";
import { ModalPlates } from "./modalPlates";
import { lb } from "lens-shmens";
import { Thunk } from "../ducks/thunks";
import { GroupHeader } from "./groupHeader";
import { ObjectUtils } from "../utils/object";
import { StringUtils } from "../utils/string";
import { IPlate, IBars, IUnit, ISettings } from "../types";
import { ILoading } from "../models/state";

interface IProps {
  dispatch: IDispatch;
  plates: IPlate[];
  loading: ILoading;
  bars: IBars;
  units: IUnit;
}

export function ScreenPlates(props: IProps): JSX.Element {
  const [shouldShowModal, setShouldShowModal] = useState<boolean>(false);
  const plates = [...props.plates];
  plates.sort((a, b) => Weight.compare(b.weight, a.weight));

  return (
    <section className="h-full">
      <HeaderView
        title="Available Plates"
        left={<button onClick={() => props.dispatch(Thunk.pullScreen())}>Back</button>}
      />
      <section style={{ paddingTop: "3.5rem", paddingBottom: "4rem" }}>
        <GroupHeader name="Bars" />
        {ObjectUtils.keys(props.bars).map((bar) => {
          return (
            <MenuItemEditable
              name={StringUtils.capitalize(bar)}
              type="number"
              value={props.bars[bar].value.toString()}
              valueUnits={props.units}
              onChange={(newValue?: string) => {
                const v = newValue != null && newValue !== "" ? parseInt(newValue, 10) : null;
                if (v != null) {
                  const lensRecording = lb<ISettings>()
                    .p("bars")
                    .p(props.units)
                    .p(bar)
                    .record(Weight.build(v, props.units));
                  props.dispatch({ type: "UpdateSettings", lensRecording });
                }
              }}
            />
          );
        })}
        <GroupHeader name="Plates" />
        {plates.map((plate) => {
          return (
            <MenuItemEditable
              name={`${plate.weight.value} ${props.units}`}
              type="number"
              value={plate.num.toString()}
              hasClear={true}
              onChange={(newValue?: string) => {
                const v = newValue != null && newValue !== "" ? parseInt(newValue, 10) : null;
                const lensRecording = lb<ISettings>()
                  .p("plates")
                  .recordModify((pl) => {
                    let newPlates;
                    if (v != null) {
                      const num = Math.floor(v / 2) * 2;
                      newPlates = pl.map((p) => (Weight.eqeq(p.weight, plate.weight) ? { ...p, num } : p));
                    } else {
                      newPlates = pl.filter((p) => !Weight.eqeq(p.weight, plate.weight));
                    }
                    return newPlates;
                  });
                props.dispatch({ type: "UpdateSettings", lensRecording });
              }}
            />
          );
        })}
        <div className="p-2 text-center">
          <Button kind="green" onClick={() => setShouldShowModal(true)}>
            Add
          </Button>
        </div>
      </section>

      <FooterView loading={props.loading} dispatch={props.dispatch} />
      <ModalPlates
        isHidden={!shouldShowModal}
        units={props.units}
        onInput={(weight) => {
          setShouldShowModal(false);
          if (weight != null) {
            const newWeight = Weight.build(weight, props.units);
            if (props.plates.every((p) => !Weight.eqeq(p.weight, newWeight))) {
              const lensRecording = lb<ISettings>()
                .p("plates")
                .recordModify((p) => [...p, { weight: newWeight, num: 0 }]);
              props.dispatch({ type: "UpdateSettings", lensRecording });
            }
          }
        }}
      />
    </section>
  );
}
