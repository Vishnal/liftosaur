import { Program } from "../../models/program";
import { IDispatch } from "../../ducks/types";
import * as React from "react";
import { ModalExercise } from "../modalExercise";
import { useState, useRef } from "react";
import { EditProgram } from "../../models/editProgram";
import { IconEdit } from "../iconEdit";
import { Exercise, equipmentName } from "../../models/exercise";
import { MenuItemEditable } from "../menuItemEditable";
import { MenuItem, MenuItemWrapper } from "../menuItem";
import { Button } from "../button";
import { ReactUtils } from "../../utils/react";
import { ExerciseImage } from "../exerciseImage";
import { ModalSubstitute } from "../modalSubstitute";
import { ISettings, IProgramDay, IProgramExercise, IEquipment, IUnit } from "../../types";
import { IDeload, IProgression, Progression } from "../../models/progression";

interface IProps {
  settings: ISettings;
  days: IProgramDay[];
  programIndex: number;
  programExercise: IProgramExercise;
  programName: string;
  dispatch: IDispatch;
}

export function EditProgramExerciseSimple(props: IProps): JSX.Element {
  const { programExercise } = props;
  const isEligible = Program.isEligibleForSimpleExercise(programExercise);
  if (isEligible.success) {
    return <Edit {...props} />;
  } else {
    return <Errors errors={isEligible.error} />;
  }
}

function Edit(props: IProps): JSX.Element {
  const { programExercise, settings } = props;

  const [showModalExercise, setShowModalExercise] = useState<boolean>(false);
  const [showModalSubstitute, setShowModalSubstitute] = useState<boolean>(false);
  const inputClassName = `block w-full px-2 py-1 leading-normal bg-white border border-gray-300 rounded-lg appearance-none focus:outline-none focus:shadow-outline`;

  const equipmentOptions: [IEquipment, string][] = Exercise.sortedEquipments(
    programExercise.exerciseType.id
  ).map((e) => [e, equipmentName(e)]);

  const sets = programExercise.variations[0].sets;
  const reps = Program.runScript(programExercise, sets[0].repsExpr, 1, settings, "reps");
  const weight = Program.runScript(programExercise, sets[0].weightExpr, 1, settings, "weight");

  const setsRef = useRef<HTMLInputElement>(null);
  const repsRef = useRef<HTMLInputElement>(null);
  const weightRef = useRef<HTMLInputElement>(null);

  function getSetsNum(): number | undefined {
    const value = setsRef.current!.value;
    if (value != null) {
      let setsNum = parseInt(value, 10);
      if (isNaN(setsNum)) {
        setsNum = 1;
      }
      setsNum = Math.max(1, Math.min(100, setsNum));
      return setsNum;
    }
    return undefined;
  }

  function getRepsNum(): number | undefined {
    const value = repsRef.current!.value;
    if (value != null) {
      let repsNum = parseInt(value, 10);
      if (isNaN(repsNum)) {
        repsNum = 1;
      }
      repsNum = Math.max(1, Math.min(999, repsNum));
      return repsNum;
    }
    return undefined;
  }

  function getWeightNum(): number | undefined {
    const value = weightRef.current!.value;
    if (value != null) {
      let weightNum = parseFloat(value);
      if (isNaN(weightNum)) {
        weightNum = 1;
      }
      weightNum = Math.max(0, Math.min(2000, weightNum));
      return weightNum;
    }
    return undefined;
  }

  const [trigger, setTrigger] = useState<boolean>(false);

  return (
    <div>
      <MenuItem
        name="Exercise"
        value={
          <>
            <button data-cy="select-exercise" className="px-4 align-middle" onClick={() => setShowModalExercise(true)}>
              <IconEdit size={20} lineColor="#0D2B3E" penColor="#A5B3BB" />
            </button>
            <span>{Exercise.get(programExercise.exerciseType, props.settings.exercises).name}</span>
            <div className="text-xs text-blue-700 underline" onClick={() => setShowModalSubstitute(true)}>
              Substitute
            </div>
          </>
        }
      />
      <MenuItemEditable
        type="select"
        name="Equipment"
        value={programExercise.exerciseType.equipment || ""}
        values={equipmentOptions}
        onChange={(newEquipment) => {
          EditProgram.changeExerciseEquipment(props.dispatch, newEquipment ? (newEquipment as IEquipment) : undefined);
        }}
      />
      <MenuItemWrapper name="exercise-image">
        <ExerciseImage
          key={`${programExercise.exerciseType.id}_${programExercise.exerciseType.equipment}`}
          exerciseType={programExercise.exerciseType}
          customExercises={props.settings.exercises}
          size="large"
        />
      </MenuItemWrapper>
      <MenuItemWrapper name="sets-reps-weight">
        <section className="flex items-center py-1">
          <div className="flex-1">
            <label>
              <div className="text-xs italic">Sets</div>
              <input
                data-cy="sets-input"
                ref={setsRef}
                type="number"
                max={100}
                min={1}
                className={inputClassName}
                placeholder="Sets"
                defaultValue={sets.length}
                onBlur={() => {
                  EditProgram.updateSimpleExercise(
                    props.dispatch,
                    props.settings.units,
                    getSetsNum(),
                    getRepsNum(),
                    getWeightNum()
                  );
                  setTrigger(!trigger);
                }}
              />
            </label>
          </div>
          <div className="px-1 pt-3">x</div>
          <div className="flex-1">
            <label>
              <div className="text-xs italic">Reps</div>
              <input
                data-cy="reps-input"
                max={100}
                min={1}
                ref={repsRef}
                type="number"
                className={inputClassName}
                placeholder="Reps"
                defaultValue={reps.success ? reps.data : ""}
                onBlur={() => {
                  EditProgram.updateSimpleExercise(
                    props.dispatch,
                    props.settings.units,
                    getSetsNum(),
                    getRepsNum(),
                    getWeightNum()
                  );
                  setTrigger(!trigger);
                }}
              />
            </label>
          </div>
          <div className="px-1 pt-3"></div>
          <div className="flex-1">
            <label>
              <div className="text-xs italic">Weight</div>
              <input
                data-cy="weight-input"
                max={2000}
                min={0}
                type="number"
                ref={weightRef}
                className={inputClassName}
                placeholder="0"
                defaultValue={weight.success ? weight.data.value : ""}
                onBlur={() => {
                  EditProgram.updateSimpleExercise(
                    props.dispatch,
                    props.settings.units,
                    getSetsNum(),
                    getRepsNum(),
                    getWeightNum()
                  );
                  setTrigger(!trigger);
                }}
              />
            </label>
          </div>
          <span className="pt-3 pl-1">{settings.units}</span>
        </section>
      </MenuItemWrapper>
      <ProgressionView
        settings={props.settings}
        dispatch={props.dispatch}
        finishDayExpr={programExercise.finishDayExpr}
      />
      <div className="p-2 text-center">
        <Button kind="green" onClick={() => EditProgram.saveExercise(props.dispatch, props.programIndex)}>
          Save
        </Button>
      </div>
      {showModalSubstitute && (
        <ModalSubstitute
          exerciseType={programExercise.exerciseType}
          settings={props.settings}
          onChange={(exerciseId) => {
            setShowModalSubstitute(false);
            if (exerciseId != null) {
              EditProgram.changeExerciseId(props.dispatch, props.settings, exerciseId);
            }
          }}
        />
      )}
      <ModalExercise
        isHidden={!showModalExercise}
        settings={props.settings}
        dispatch={props.dispatch}
        onChange={(exerciseId) => {
          setShowModalExercise(false);
          if (exerciseId != null) {
            EditProgram.changeExerciseId(props.dispatch, props.settings, exerciseId);
          }
        }}
      />
    </div>
  );
}

interface IErrorsProps {
  errors: string[];
}

function Errors(props: IErrorsProps): JSX.Element {
  return (
    <section className="p-4 text-sm">
      <p>
        You can't use <strong>Simple</strong> exercise editing, only <strong>Advanced</strong>, because to make it
        possible to use Simple editing, the exercise:
      </p>
      <ul className="pl-4 mt-2 list-disc" data-cy="simple-errors">
        {props.errors.map((e, i) => (
          <li key={i} dangerouslySetInnerHTML={{ __html: e }} />
        ))}
      </ul>
      <p className="mt-2">
        So, please use <strong>Advanced</strong> editing mode.
      </p>
    </section>
  );
}

interface IProgressionProps {
  finishDayExpr: string;
  settings: ISettings;
  dispatch: IDispatch;
}

function ProgressionView(props: IProgressionProps): JSX.Element {
  const { settings, dispatch, finishDayExpr } = props;
  const inputClassName = `inline-block w-10 px-1 py-1 leading-normal bg-white border border-gray-300 rounded-lg appearance-none focus:outline-none focus:shadow-outline`;

  const [progression, setProgression] = ReactUtils.useStateWithCallback<IProgression | undefined>(
    () => Progression.getProgression(finishDayExpr),
    () => {
      EditProgram.setProgression(dispatch, progression, deload);
    }
  );

  const [deload, setDeload] = ReactUtils.useStateWithCallback<IDeload | undefined>(
    () => Progression.getDeload(finishDayExpr),
    () => {
      EditProgram.setProgression(dispatch, progression, deload);
    }
  );

  const progressionIncrementRef = useRef<HTMLInputElement>(null);
  const progressionUnitRef = useRef<HTMLSelectElement>(null);
  const progressionAttemptsRef = useRef<HTMLInputElement>(null);
  const deloadDecrementsRef = useRef<HTMLInputElement>(null);
  const deloadUnitRef = useRef<HTMLSelectElement>(null);
  const deloadFailuresRef = useRef<HTMLInputElement>(null);

  return (
    <section>
      <MenuItemEditable
        type="boolean"
        isNameHtml={true}
        name="&#x2B06&nbsp;&nbsp;Enable&nbsp;Progression"
        value={progression != null ? "true" : "false"}
        onChange={(v) => {
          const newProgression = progression == null ? { increment: 5, unit: settings.units, attempts: 1 } : undefined;
          setProgression(newProgression);
        }}
      />
      {progression != null && (
        <MenuItemWrapper name="progression">
          <span>Increase by </span>
          <input
            min="0"
            max="100"
            ref={progressionIncrementRef}
            className={inputClassName}
            type="text"
            defaultValue={progression.increment}
            onBlur={() => {
              let value: number | undefined = parseFloat(progressionIncrementRef.current!.value);
              value = isNaN(value) ? undefined : Math.max(0, Math.min(100, value));
              if (value != null) {
                setProgression({ ...progression, increment: value });
              }
            }}
          />
          <select
            ref={progressionUnitRef}
            name="units"
            onChange={() => {
              const unit = progressionUnitRef.current!.value as IUnit | "%";
              if (unit != null) {
                setProgression({ ...progression, unit });
              }
            }}
          >
            <option selected={progression.unit === settings.units} value={settings.units}>
              {settings.units}
            </option>
            <option selected={progression.unit === "%"} value="%">
              %
            </option>
          </select>
          <span> after </span>
          <input
            ref={progressionAttemptsRef}
            className={inputClassName}
            type="number"
            defaultValue={progression.attempts}
            onBlur={() => {
              let value: number | undefined = parseInt(progressionAttemptsRef.current!.value, 10);
              value = isNaN(value) ? undefined : Math.max(0, Math.min(20, value));
              if (value != null) {
                setProgression({ ...progression, attempts: value });
              }
            }}
          />
          <span> successful attempts.</span>
        </MenuItemWrapper>
      )}
      <MenuItemEditable
        type="boolean"
        isNameHtml={true}
        name="&#x2B07&nbsp;&nbsp;Enable&nbsp;Deload"
        value={deload != null ? "true" : "false"}
        onChange={(v) => {
          const newDeload = deload == null ? { decrement: 5, unit: settings.units, attempts: 1 } : undefined;
          setDeload(newDeload);
          EditProgram.setProgression(dispatch, progression, newDeload);
        }}
      />
      {deload != null && (
        <MenuItemWrapper name="deload">
          <span>Decrease by </span>
          <input
            ref={deloadDecrementsRef}
            className={inputClassName}
            type="text"
            defaultValue={deload.decrement}
            onBlur={() => {
              let value: number | undefined = parseFloat(deloadDecrementsRef.current!.value);
              value = isNaN(value) ? undefined : Math.max(0, Math.min(100, value));
              if (value != null) {
                setDeload({ ...deload, decrement: value });
              }
            }}
          />
          <select
            ref={deloadUnitRef}
            name="units"
            onChange={() => {
              const unit = deloadUnitRef.current!.value as IUnit | "%";
              if (unit != null) {
                setDeload({ ...deload, unit });
              }
            }}
          >
            <option selected={deload.unit === settings.units} value={settings.units}>
              {settings.units}
            </option>
            <option selected={deload.unit === "%"} value="%">
              %
            </option>
          </select>
          <span> after </span>
          <input
            ref={deloadFailuresRef}
            className={inputClassName}
            type="number"
            defaultValue={deload.attempts}
            onBlur={() => {
              let value: number | undefined = parseInt(deloadFailuresRef.current!.value, 10);
              value = isNaN(value) ? undefined : Math.max(0, Math.min(20, value));
              if (value != null) {
                setDeload({ ...deload, attempts: value });
              }
            }}
          />
          <span> failed attempts.</span>
        </MenuItemWrapper>
      )}
    </section>
  );
}
