import * as React from "react";
import { buildCardsReducer, ICardsAction } from "../ducks/reducer";
import { IDispatch } from "../ducks/types";
import { Program } from "../models/program";
import { History } from "../models/history";
import { IHistoryRecord, IProgramDay, IProgramExercise, ISettings } from "../types";
import { ExerciseView } from "./exercise";
import { GroupHeader } from "./groupHeader";
import { MenuItemEditable } from "./menuItemEditable";
import { ModalAmrap } from "./modalAmrap";
import { ModalWeight } from "./modalWeight";
import { useRef } from "react";

export interface IPlaygroundProps {
  progress: IHistoryRecord;
  programExercise: IProgramExercise;
  settings: ISettings;
  day: number;
  days: IProgramDay[];
  onProgressChange: (p: IHistoryRecord) => void;
}

export function Playground(props: IPlaygroundProps): JSX.Element {
  const { programExercise, days, settings, progress } = props;
  const entry = progress.entries[0];
  const progressRef = useRef(props.progress);
  progressRef.current = props.progress;

  const dispatch: IDispatch = async (action) => {
    const newProgress = buildCardsReducer(settings)(progressRef.current, action as ICardsAction);
    props.onProgressChange(newProgress);
  };

  return (
    <>
      <GroupHeader
        name="Playground"
        help={
          <span>
            Allows to try out the logic added to this exercise. Choose a day, simulate workout, and verify that the{" "}
            <strong>State Variables</strong> changes are what you expect.
          </span>
        }
      />
      <MenuItemEditable
        name="Choose Day"
        type="select"
        value={`${props.progress.day}`}
        values={[...days.map<[string, string]>((d, i) => [(i + 1).toString(), `${i + 1} - ${d.name}`])]}
        onChange={(newValue) => {
          const newDay = parseInt(newValue || "1", 10);
          const nextVariationIndex = Program.nextVariationIndex(programExercise, newDay, settings);
          const newEntry = Program.nextHistoryEntry(
            programExercise.exerciseType,
            newDay,
            programExercise.variations[nextVariationIndex].sets,
            programExercise.state,
            settings,
            programExercise.warmupSets
          );
          props.onProgressChange(History.buildFromEntry(newEntry, newDay));
        }}
      />
      <ExerciseView
        history={[]}
        showHelp={false}
        entry={entry}
        day={props.day}
        programExercise={programExercise}
        index={0}
        forceShowStateChanges={true}
        settings={props.settings}
        dispatch={dispatch}
        onChangeReps={() => undefined}
        isCurrent={true}
      />
      <ModalAmrap isHidden={progress.ui?.amrapModal == null} dispatch={dispatch} />
      <ModalWeight
        programExercise={progress.ui?.weightModal?.programExercise}
        isHidden={progress.ui?.weightModal == null}
        units={props.settings.units}
        dispatch={dispatch}
        weight={progress.ui?.weightModal?.weight ?? 0}
      />
    </>
  );
}
