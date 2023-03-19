/* eslint-disable @typescript-eslint/unified-signatures */
import { Exercise } from "./exercise";
import { Reps } from "./set";
import { Weight } from "./weight";
import { Screen } from "./screen";
import { DateUtils } from "../utils/date";
import { lf, lb } from "lens-shmens";
import { ObjectUtils } from "../utils/object";
import { IDispatch } from "../ducks/types";
import { ScriptRunner } from "../parser";

import { Program } from "./program";
import { IState, updateState } from "./state";
import {
  IWeight,
  IHistoryEntry,
  ISettings,
  IHistoryRecord,
  IProgressMode,
  IExerciseType,
  IProgressUi,
  IProgram,
  IProgramDay,
  IProgramState,
  IEquipment,
  IProgramExercise,
  ISubscription,
} from "../types";
import { SendMessage } from "../utils/sendMessage";
import { ProgramExercise } from "./programExercise";
import { Subscriptions } from "../utils/subscriptions";

export interface IScriptBindings {
  day: number;
  weights: IWeight[];
  reps: number[];
  completedReps: number[];
  w: IWeight[];
  r: number[];
  cr: number[];
}

export interface IScriptContext {
  equipment?: IEquipment;
}

export interface IScriptFunctions {
  roundWeight: (num: IWeight, context: IScriptContext) => IWeight;
  calculateTrainingMax: (weight: IWeight, reps: number, context: IScriptContext) => IWeight;
}

export namespace Progress {
  export function createEmptyScriptBindings(day: number): IScriptBindings {
    return {
      day,
      weights: [],
      reps: [],
      completedReps: [],
      w: [],
      r: [],
      cr: [],
    };
  }

  export function createScriptBindings(day: number, entry: IHistoryEntry): IScriptBindings {
    const bindings = createEmptyScriptBindings(day);
    for (const set of entry.sets) {
      bindings.weights.push(set.weight);
      bindings.reps.push(set.reps);
      bindings.completedReps.push(set.completedReps || 0);
    }
    bindings.w = bindings.weights;
    bindings.r = bindings.reps;
    bindings.cr = bindings.completedReps;
    return bindings;
  }

  export function createScriptFunctions(settings: ISettings): IScriptFunctions {
    return {
      roundWeight: (num, context) => {
        if (!Weight.is(num)) {
          num = Weight.build(num, settings.units);
        }
        return Weight.round(num, settings, context?.equipment || "barbell");
      },
      calculateTrainingMax: (weight, reps, context) => {
        if (!Weight.is(weight)) {
          weight = Weight.build(weight, settings.units);
        }
        return Weight.getTrainingMax(weight, reps || 0, settings, "barbell");
      },
    };
  }

  export function isCurrent(progress: IHistoryRecord): boolean {
    return progress.id === 0;
  }

  export function startTimer(
    progress: IHistoryRecord,
    timestamp: number,
    mode: IProgressMode,
    timer: number,
    settings: ISettings,
    subscription: ISubscription
  ): IHistoryRecord {
    const duration = settings.timers[mode];
    if (duration != null && Subscriptions.hasSubscription(subscription)) {
      SendMessage.toIos({ type: "startTimer", duration: duration.toString(), mode });
      SendMessage.toAndroid({ type: "startTimer", duration: duration.toString(), mode });
    }
    return {
      ...progress,
      timerSince: timestamp,
      timer,
      timerMode: mode,
    };
  }

  export function stopTimer(progress: IHistoryRecord): IHistoryRecord {
    SendMessage.toIos({ type: "stopTimer" });
    SendMessage.toAndroid({ type: "stopTimer" });
    return {
      ...progress,
      timerSince: undefined,
      timerMode: undefined,
    };
  }

  export function findEntryByExercise(
    progress: IHistoryRecord,
    exerciseType: IExerciseType
  ): IHistoryEntry | undefined {
    return progress.entries.find((entry) => entry.exercise === exerciseType);
  }

  export function isFullyCompletedSet(progress: IHistoryRecord): boolean {
    return progress.entries.every((entry) => isCompletedSet(entry));
  }

  export function isCompletedSet(entry: IHistoryEntry): boolean {
    return Reps.isCompleted(entry.sets);
  }

  export function isFullyFinishedSet(progress: IHistoryRecord): boolean {
    return progress.entries.every((entry) => isFinishedSet(entry));
  }

  export function isFullyEmptySet(progress: IHistoryRecord): boolean {
    return progress.entries.every((entry) => Reps.isEmpty(entry.sets));
  }

  export function isFinishedSet(entry: IHistoryEntry): boolean {
    return Reps.isFinished(entry.sets);
  }

  export function showUpdateWeightModal(
    progress: IHistoryRecord,
    exercise: IExerciseType,
    weight: IWeight,
    programExercise?: IProgramExercise
  ): IHistoryRecord {
    return {
      ...progress,
      ui: {
        ...progress.ui,
        weightModal: {
          exercise,
          weight: weight,
          programExercise,
        },
      },
    };
  }

  export function showUpdateDate(progress: IHistoryRecord, date: string): IHistoryRecord {
    return {
      ...progress,
      ui: {
        ...progress.ui,
        dateModal: { date },
      },
    };
  }

  export function stop(
    progresses: Record<number, IHistoryRecord | undefined>,
    id: number
  ): Record<number, IHistoryRecord | undefined> {
    return ObjectUtils.keys(progresses).reduce<Record<number, IHistoryRecord | undefined>>((memo, k) => {
      const p = progresses[k];
      if (p != null && p.id !== id) {
        memo[k] = p;
      }
      return memo;
    }, {});
  }

  export function changeDate(progress: IHistoryRecord, date?: string): IHistoryRecord {
    return {
      ...progress,
      ...(date != null ? { date: DateUtils.fromYYYYMMDD(date) } : {}),
      ui: {
        ...progress.ui,
        dateModal: undefined,
      },
    };
  }

  export function getProgress(state: Pick<IState, "currentHistoryRecord" | "progress">): IHistoryRecord | undefined {
    return state.currentHistoryRecord != null ? state.progress[state.currentHistoryRecord] : undefined;
  }

  export function setProgress(state: IState, progress: IHistoryRecord): IState {
    if (state.currentHistoryRecord != null) {
      return lf(state).p("progress").p(state.currentHistoryRecord).set(progress);
    } else {
      return state;
    }
  }

  export function updateRepsInExercise(
    progress: IHistoryRecord,
    exercise: IExerciseType,
    weight: IWeight,
    setIndex: number,
    mode: IProgressMode
  ): IHistoryRecord {
    if (mode === "warmup") {
      const firstWeight = progress.entries.find((e) => e.exercise === exercise)?.sets[0]?.weight;
      if (firstWeight != null) {
        return {
          ...progress,
          entries: progress.entries.map((progressEntry) => {
            if (progressEntry.exercise === exercise) {
              const progressSets = progressEntry.warmupSets;
              const progressSet = progressSets[setIndex];
              if (progressSet?.completedReps == null) {
                progressSets[setIndex] = { ...progressSet, completedReps: progressSet.reps as number, weight };
              } else if (progressSet.completedReps > 0) {
                progressSets[setIndex] = {
                  ...progressSet,
                  completedReps: progressSet.completedReps - 1,
                  weight,
                };
              } else {
                progressSets[setIndex] = { ...progressSet, completedReps: undefined, weight };
              }
              return { ...progressEntry, warmupSets: progressSets };
            } else {
              return progressEntry;
            }
          }),
        };
      } else {
        return progress;
      }
    } else {
      const entry = progress.entries.find((e) => e.exercise === exercise)!;
      if (entry.sets[setIndex].isAmrap) {
        const amrapUi: IProgressUi = { amrapModal: { exercise, setIndex, weight } };
        return {
          ...progress,
          ui: {
            ...progress.ui,
            ...amrapUi,
          },
        };
      } else {
        return {
          ...progress,
          entries: progress.entries.map((progressEntry) => {
            if (progressEntry.exercise === exercise) {
              const sets = [...progressEntry.sets];
              const set = sets[setIndex];
              if (set.completedReps == null) {
                sets[setIndex] = {
                  ...set,
                  completedReps: set.reps as number,
                  weight,
                  timestamp: set.timestamp ?? Date.now(),
                };
              } else if (set.completedReps > 0) {
                sets[setIndex] = {
                  ...set,
                  completedReps: set.completedReps - 1,
                  weight,
                  timestamp: set.timestamp ?? Date.now(),
                };
              } else {
                sets[setIndex] = { ...set, completedReps: undefined, weight, timestamp: set.timestamp ?? Date.now() };
              }
              return { ...progressEntry, sets: sets };
            } else {
              return progressEntry;
            }
          }),
        };
      }
    }
  }

  export function updateAmrapRepsInExercise(progress: IHistoryRecord, value?: number): IHistoryRecord {
    if (progress.ui?.amrapModal != null) {
      const { exercise, setIndex, weight } = progress.ui.amrapModal;
      return {
        ...progress,
        ui: { ...progress.ui, amrapModal: undefined },
        entries: progress.entries.map((progressEntry) => {
          if (progressEntry.exercise === exercise) {
            const sets = [...progressEntry.sets];
            const set = sets[setIndex];
            if (value == null) {
              sets[setIndex] = { ...set, completedReps: undefined, weight };
            } else {
              sets[setIndex] = { ...set, completedReps: value, weight };
            }
            return { ...progressEntry, sets: sets };
          } else {
            return progressEntry;
          }
        }),
      };
    } else {
      return progress;
    }
  }

  export function updateWeight(
    progress: IHistoryRecord,
    settings: ISettings,
    weight?: IWeight,
    programExercise?: IProgramExercise
  ): IHistoryRecord {
    if (weight != null && progress.ui?.weightModal != null) {
      const { exercise, weight: previousWeight } = progress.ui.weightModal;

      return {
        ...progress,
        ui: { ...progress.ui, weightModal: undefined },
        entries: progress.entries.map((progressEntry) => {
          const eq = (a: IWeight, b: IWeight): boolean => {
            const bar = progressEntry.exercise.equipment;
            return Weight.eq(Weight.roundConvertTo(a, settings, bar), Weight.roundConvertTo(b, settings, bar));
          };
          if (Exercise.eq(progressEntry.exercise, exercise)) {
            const firstWeight = progressEntry.sets[0]?.weight;
            return {
              ...progressEntry,
              sets: progressEntry.sets.map((set) => {
                if (eq(set.weight, previousWeight) && weight != null) {
                  return { ...set, weight: Weight.round(weight, settings, progressEntry.exercise.equipment) };
                } else {
                  return set;
                }
              }),
              warmupSets:
                eq(firstWeight, previousWeight) && weight != null
                  ? Exercise.getWarmupSets(exercise, weight, settings, programExercise?.warmupSets)
                  : progressEntry.warmupSets,
            };
          } else {
            return progressEntry;
          }
        }),
      };
    } else {
      return { ...progress, ui: { ...progress.ui, weightModal: undefined } };
    }
  }

  export function editDayAction(dispatch: IDispatch, programId: string, dayIndex: number): void {
    updateState(dispatch, [
      lb<IState>().p("editProgram").record({ id: programId, dayIndex: dayIndex }),
      lb<IState>()
        .p("screenStack")
        .recordModify((s) => Screen.push(s, "editProgramDay")),
    ]);
  }

  export function editExerciseNotes(dispatch: IDispatch, progressId: number, entryIndex: number, notes: string): void {
    updateState(dispatch, [
      lb<IState>().p("progress").pi(progressId).p("entries").i(entryIndex).p("notes").record(notes),
    ]);
  }

  export function editNotes(dispatch: IDispatch, progressId: number, notes: string): void {
    updateState(dispatch, [lb<IState>().p("progress").pi(progressId).p("notes").record(notes)]);
  }

  export function applyProgramExercise(
    progressEntry: IHistoryEntry | undefined,
    programExercise: IProgramExercise,
    allProgramExercises: IProgramExercise[],
    day: number,
    settings: ISettings,
    forceWarmupSets?: boolean
  ): IHistoryEntry {
    const variationIndex = Program.nextVariationIndex(programExercise, allProgramExercises, day, settings);
    const sets = ProgramExercise.getVariations(programExercise, allProgramExercises)[variationIndex].sets;
    const state = ProgramExercise.getState(programExercise, allProgramExercises);
    const programExerciseWarmupSets = ProgramExercise.getWarmupSets(programExercise, allProgramExercises);

    const firstWeightExpr = sets[0]?.weightExpr;
    const firstWeight =
      firstWeightExpr != null
        ? executeEntryScript(
            firstWeightExpr,
            day,
            state,
            { equipment: programExercise.exerciseType.equipment },
            settings,
            "weight"
          )
        : undefined;

    if (progressEntry != null && sets.length === progressEntry.sets.length) {
      return {
        ...progressEntry,
        exercise: programExercise.exerciseType,
        warmupSets: forceWarmupSets
          ? firstWeight != null
            ? Exercise.getWarmupSets(programExercise.exerciseType, firstWeight, settings, programExerciseWarmupSets)
            : []
          : progressEntry.warmupSets,
        sets: progressEntry.sets.map((set, i) => {
          const weight = executeEntryScript(
            sets[i].weightExpr,
            day,
            state,
            { equipment: programExercise.exerciseType.equipment },
            settings,
            "weight"
          );
          const roundedWeight = Weight.roundConvertTo(weight, settings, programExercise.exerciseType.equipment);
          return {
            ...set,
            reps: executeEntryScript(
              sets[i].repsExpr,
              day,
              state,
              { equipment: programExercise.exerciseType.equipment },
              settings,
              "reps"
            ),
            weight: roundedWeight,
            isAmrap: sets[i].isAmrap,
          };
        }),
      };
    } else {
      return {
        exercise: programExercise.exerciseType,
        sets: sets.map((set) => {
          const weight = executeEntryScript(
            set.weightExpr,
            day,
            state,
            { equipment: programExercise.exerciseType.equipment },
            settings,
            "weight"
          );
          const roundedWeight = Weight.roundConvertTo(weight, settings, programExercise.exerciseType.equipment);
          return {
            reps: executeEntryScript(
              set.repsExpr,
              day,
              state,
              { equipment: programExercise.exerciseType.equipment },
              settings,
              "reps"
            ),
            weight: roundedWeight,
            isAmrap: set.isAmrap,
          };
        }),
        warmupSets:
          firstWeight != null
            ? Exercise.getWarmupSets(programExercise.exerciseType, firstWeight, settings, programExerciseWarmupSets)
            : [],
      };
    }
  }

  export function applyProgramDay(
    progress: IHistoryRecord,
    program: IProgram,
    programDay: IProgramDay,
    settings: ISettings
  ): IHistoryRecord {
    const day = progress.day;
    return {
      ...progress,
      entries: programDay.exercises.map((dayEntry) => {
        const programExercise = program.exercises.find((e) => e.id === dayEntry.id)!;
        const progressEntry = progress.entries.find((e) => programExercise.exerciseType.id === e.exercise.id);
        return applyProgramExercise(progressEntry, programExercise, program.exercises, day, settings);
      }),
    };
  }

  export function executeEntryScript(
    expr: string,
    day: number,
    state: IProgramState,
    context: IScriptContext,
    settings: ISettings,
    type: "weight"
  ): IWeight;
  export function executeEntryScript(
    expr: string,
    day: number,
    state: IProgramState,
    context: IScriptContext,
    settings: ISettings,
    type: "reps"
  ): number;
  export function executeEntryScript(
    expr: string,
    day: number,
    state: IProgramState,
    context: IScriptContext,
    settings: ISettings,
    type: "timer"
  ): number;
  export function executeEntryScript(
    expr: string,
    day: number,
    state: IProgramState,
    context: IScriptContext,
    settings: ISettings,
    type: "reps" | "weight" | "timer"
  ): IWeight | number {
    const runner = new ScriptRunner(
      expr,
      state,
      createEmptyScriptBindings(day),
      createScriptFunctions(settings),
      settings.units,
      context
    );
    if (type === "reps") {
      return runner.execute(type);
    } else if (type === "timer") {
      return runner.execute(type);
    } else {
      return runner.execute(type);
    }
  }
}
