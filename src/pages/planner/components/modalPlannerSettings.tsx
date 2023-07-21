import { lb } from "lens-shmens";
import { h, JSX } from "preact";
import { Input } from "../../../components/input";
import { MenuItemValue } from "../../../components/menuItemEditable";
import { Modal } from "../../../components/modal";
import { screenMuscles } from "../../../models/muscle";
import { ObjectUtils } from "../../../utils/object";
import { StringUtils } from "../../../utils/string";
import { ILensDispatch } from "../../../utils/useLensReducer";
import { IPlannerSettings, IPlannerState } from "../models/types";

interface IModalPlannerSettingsProps {
  settings: IPlannerSettings;
  dispatch: ILensDispatch<IPlannerState>;
  onClose: () => void;
}

export function ModalPlannerSettings(props: IModalPlannerSettingsProps): JSX.Element {
  return (
    <Modal shouldShowClose={true} onClose={props.onClose}>
      <form style={{ minWidth: "32rem" }}>
        <div className="flex mb-2" style={{ gap: "1rem" }}>
          <div className="flex-1">
            <Input
              label="Rest Timer"
              min={0}
              type="number"
              value={props.settings.restTimer}
              changeHandler={(e) => {
                if (e.success) {
                  const value = parseInt(e.data, 10);
                  if (!isNaN(value)) {
                    const clampedValue = Math.max(0, value);
                    props.dispatch(lb<IPlannerState>().p("settings").p("restTimer").record(clampedValue));
                  }
                }
              }}
            />
          </div>
          <div className="flex-1">
            <Input
              label="Synergist multiplier"
              min={0}
              type="number"
              value={props.settings.synergistMultiplier}
              changeHandler={(e) => {
                if (e.success) {
                  const value = parseFloat(e.data);
                  if (!isNaN(value)) {
                    const clampedValue = Math.max(0, value);
                    props.dispatch(lb<IPlannerState>().p("settings").p("synergistMultiplier").record(clampedValue));
                  }
                }
              }}
            />
          </div>
        </div>
        <div className="mt-4 mb-1">
          <label>
            <span className="mr-2">Sets split preset:</span>
            <MenuItemValue
              name="Sets split preset"
              setPatternError={() => undefined}
              type="desktop-select"
              value=""
              values={[
                ["", ""],
                ["strength", "Strength"],
                ["hypertrophy", "Hypertrophy"],
              ]}
              onChange={(newValue) => {
                if (newValue === "strength") {
                  props.dispatch([
                    lb<IPlannerState>().p("settings").p("strengthSetsPct").record(70),
                    lb<IPlannerState>().p("settings").p("hypertrophySetsPct").record(30),
                  ]);
                } else if (newValue === "hypertrophy") {
                  props.dispatch([
                    lb<IPlannerState>().p("settings").p("strengthSetsPct").record(30),
                    lb<IPlannerState>().p("settings").p("hypertrophySetsPct").record(70),
                  ]);
                }
              }}
            />
          </label>
        </div>
        <div className="flex mb-2" style={{ gap: "1rem" }}>
          <div className="flex-1">
            <Input
              label="Strength sets percentage"
              min={0}
              max={100}
              type="number"
              value={props.settings.strengthSetsPct}
              changeHandler={(e) => {
                if (e.success) {
                  const value = parseInt(e.data, 10);
                  if (!isNaN(value)) {
                    const clampedValue = Math.min(100, Math.max(0, value));
                    props.dispatch(lb<IPlannerState>().p("settings").p("strengthSetsPct").record(clampedValue));
                  }
                }
              }}
            />
          </div>
          <div className="flex-1">
            <Input
              label="Hypertrophy sets percentage"
              min={0}
              max={100}
              type="number"
              value={props.settings.hypertrophySetsPct}
              changeHandler={(e) => {
                if (e.success) {
                  const value = parseInt(e.data, 10);
                  if (!isNaN(value)) {
                    const clampedValue = Math.min(100, Math.max(0, value));
                    props.dispatch(lb<IPlannerState>().p("settings").p("hypertrophySetsPct").record(clampedValue));
                  }
                }
              }}
            />
          </div>
        </div>
        <div className="mt-4 mb-1">
          <label>
            <span className="mr-2">Muscle Groups sets preset:</span>
            <MenuItemValue
              name="Sets split preset"
              setPatternError={() => undefined}
              type="desktop-select"
              value=""
              values={[
                ["", ""],
                ["novice", "Novice"],
                ["intermediate", "Intermediate"],
                ["advanced", "Advanced"],
              ]}
              onChange={(newValue) => {
                if (newValue === "novice") {
                  props.dispatch([
                    lb<IPlannerState>()
                      .p("settings")
                      .p("weeklyRangeSets")
                      .recordModify((weeklyRangeSets) => {
                        return ObjectUtils.mapValues(weeklyRangeSets, (e) => [10, 12] as [number, number]);
                      }),
                    lb<IPlannerState>()
                      .p("settings")
                      .p("weeklyFrequency")
                      .recordModify((weeklyFrequency) => {
                        return ObjectUtils.mapValues(weeklyFrequency, (e) => 2);
                      }),
                  ]);
                } else if (newValue === "intermediate") {
                  props.dispatch([
                    lb<IPlannerState>()
                      .p("settings")
                      .p("weeklyRangeSets")
                      .recordModify((weeklyRangeSets) => {
                        return ObjectUtils.mapValues(weeklyRangeSets, (e) => [13, 15] as [number, number]);
                      }),
                    lb<IPlannerState>()
                      .p("settings")
                      .p("weeklyFrequency")
                      .recordModify((weeklyFrequency) => {
                        return ObjectUtils.mapValues(weeklyFrequency, (e) => 3);
                      }),
                  ]);
                } else if (newValue === "advanced") {
                  props.dispatch([
                    lb<IPlannerState>()
                      .p("settings")
                      .p("weeklyRangeSets")
                      .recordModify((weeklyRangeSets) => {
                        return ObjectUtils.mapValues(weeklyRangeSets, (e) => [16, 20] as [number, number]);
                      }),
                    lb<IPlannerState>()
                      .p("settings")
                      .p("weeklyFrequency")
                      .recordModify((weeklyFrequency) => {
                        return ObjectUtils.mapValues(weeklyFrequency, (e) => 4);
                      }),
                  ]);
                }
              }}
            />
          </label>
        </div>
        <ul>
          {screenMuscles.map((muscleGroup) => {
            return (
              <li className="flex items-center mb-2" style={{ gap: "0.5rem" }}>
                <div className="w-32 font-bold">{StringUtils.capitalize(muscleGroup)}</div>
                <div className="flex-1">
                  <Input
                    label="Weekly sets min"
                    min={0}
                    type="number"
                    value={props.settings.weeklyRangeSets[muscleGroup][0]}
                    changeHandler={(e) => {
                      if (e.success) {
                        const value = parseInt(e.data, 10);
                        if (!isNaN(value)) {
                          const clampedValue = Math.max(0, value);
                          props.dispatch(
                            lb<IPlannerState>()
                              .p("settings")
                              .p("weeklyRangeSets")
                              .p(muscleGroup)
                              .i(0)
                              .record(clampedValue)
                          );
                        }
                      }
                    }}
                  />
                </div>
                <div className="flex-1">
                  <Input
                    label="Weekly sets max"
                    min={0}
                    type="number"
                    value={props.settings.weeklyRangeSets[muscleGroup][1]}
                    changeHandler={(e) => {
                      if (e.success) {
                        const value = parseInt(e.data, 10);
                        if (!isNaN(value)) {
                          const clampedValue = Math.max(0, value);
                          props.dispatch(
                            lb<IPlannerState>()
                              .p("settings")
                              .p("weeklyRangeSets")
                              .p(muscleGroup)
                              .i(1)
                              .record(clampedValue)
                          );
                        }
                      }
                    }}
                  />
                </div>
                <div className="flex-1">
                  <Input
                    label="Frequency, days"
                    min={0}
                    type="number"
                    value={props.settings.weeklyFrequency[muscleGroup]}
                    changeHandler={(e) => {
                      if (e.success) {
                        const value = parseInt(e.data, 10);
                        if (!isNaN(value)) {
                          const clampedValue = Math.max(0, value);
                          props.dispatch(
                            lb<IPlannerState>().p("settings").p("weeklyFrequency").p(muscleGroup).record(clampedValue)
                          );
                        }
                      }
                    }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </form>
    </Modal>
  );
}
