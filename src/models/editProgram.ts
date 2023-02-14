import { lb, lf, lbu, ILensRecordingPayload } from "lens-shmens";
import { Program } from "./program";
import { Screen } from "./screen";
import { IDispatch } from "../ducks/types";
import { Exercise, IExercise, warmupValues } from "./exercise";
import { Weight } from "./weight";
import { UidFactory } from "../utils/generator";
import { ObjectUtils } from "../utils/object";
import { updateState, IState } from "./state";
import { StringUtils } from "../utils/string";
import {
  IWeight,
  IUnit,
  IExerciseId,
  IEquipment,
  IProgram,
  IProgramExercise,
  ISettings,
  IProgramExerciseWarmupSet,
} from "../types";
import { CollectionUtils } from "../utils/collection";
import { IProgramState } from "../types";
import { ProgramExercise } from "./programExercise";
import { EditProgramLenses } from "./editProgramLenses";

interface I531Tms {
  squat: IWeight;
  benchPress: IWeight;
  deadlift: IWeight;
  overheadPress: IWeight;
}

export namespace EditProgram {
  export function addStateVariable(dispatch: IDispatch, newName?: string, newType?: IUnit): void {
    if (newName != null && newType != null) {
      updateState(dispatch, [
        lb<IState>()
          .pi("editExercise")
          .p("state")
          .recordModify((state) => {
            const newState = { ...state };
            let newValue: IWeight | number;
            if (newType === "lb" || newType === "kg") {
              newValue = Weight.build(0, newType);
            } else {
              newValue = 0;
            }
            newState[newName] = newValue;
            return newState;
          }),
      ]);
    }
  }

  export function editStateVariable(dispatch: IDispatch, stateKey: string, newValue?: string): void {
    updateState(dispatch, [
      lb<IState>()
        .pi("editExercise")
        .p("state")
        .recordModify((state) => {
          return updateStateVariable(state, stateKey, newValue);
        }),
    ]);
  }

  export function editReuseLogicStateVariable(
    dispatch: IDispatch,
    reuseLogicId: string,
    stateKey: string,
    newValue?: string
  ): void {
    updateState(dispatch, [
      lb<IState>()
        .pi("editExercise")
        .pi("reuseLogic")
        .pi("states")
        .pi(reuseLogicId)
        .recordModify((state) => {
          return updateStateVariable(state, stateKey, newValue);
        }),
    ]);
  }

  function updateStateVariable(state: IProgramState, stateKey: string, newValue?: string): IProgramState {
    const v = newValue != null && newValue !== "" ? parseFloat(newValue) : null;
    const newState = { ...state };
    const value = state[stateKey];
    if (v != null) {
      newState[stateKey] = Weight.is(value) ? Weight.build(v, value.unit) : v;
    } else {
      delete newState[stateKey];
    }
    return newState;
  }

  export function changeExerciseName(dispatch: IDispatch, newName?: string): void {
    updateState(dispatch, [
      lb<IState>()
        .pi("editExercise")
        .p("name")
        .record(newName || ""),
    ]);
  }

  export function changeExerciseId(dispatch: IDispatch, settings: ISettings, newId?: IExerciseId): void {
    if (newId != null) {
      const exercise = Exercise.get({ id: newId, equipment: "barbell" }, settings.exercises);
      updateState(dispatch, [
        lb<IState>().pi("editExercise").p("exerciseType").p("id").record(exercise.id),
        lb<IState>().pi("editExercise").p("exerciseType").p("equipment").record(exercise.defaultEquipment),
        lb<IState>().pi("editExercise").p("name").record(exercise.name),
        lb<IState>().pi("editExercise").p("warmupSets").record(undefined),
      ]);
    }
  }

  export function changeExerciseEquipment(dispatch: IDispatch, newEquipment?: IEquipment): void {
    updateState(dispatch, [lb<IState>().pi("editExercise").p("exerciseType").p("equipment").record(newEquipment)]);
  }

  export function setReps(dispatch: IDispatch, value: string, variationIndex: number, setIndex: number): void {
    updateState(dispatch, [
      lb<IState>()
        .pi("editExercise")
        .p("variations")
        .i(variationIndex)
        .p("sets")
        .i(setIndex)
        .p("repsExpr")
        .record(value),
    ]);
  }

  export function setWeight(dispatch: IDispatch, value: string, variationIndex: number, setIndex: number): void {
    updateState(dispatch, [
      lb<IState>()
        .pi("editExercise")
        .p("variations")
        .i(variationIndex)
        .p("sets")
        .i(setIndex)
        .p("weightExpr")
        .record(value),
    ]);
  }

  export function setAmrap(dispatch: IDispatch, value: boolean, variationIndex: number, setIndex: number): void {
    updateState(dispatch, [
      lb<IState>()
        .pi("editExercise")
        .p("variations")
        .i(variationIndex)
        .p("sets")
        .i(setIndex)
        .p("isAmrap")
        .record(value),
    ]);
  }

  export function setExerciseFinishDayExpr(dispatch: IDispatch, value: string): void {
    updateState(dispatch, [lb<IState>().pi("editExercise").p("finishDayExpr").record(value)]);
  }

  export function setExerciseVariationExpr(dispatch: IDispatch, value: string): void {
    updateState(dispatch, [lb<IState>().pi("editExercise").p("variationExpr").record(value)]);
  }

  export function addVariation(dispatch: IDispatch): void {
    updateState(dispatch, [
      lb<IState>()
        .pi("editExercise")
        .p("variations")
        .recordModify((v) => {
          return [...v, Program.createVariation()];
        }),
    ]);
  }

  export function removeVariation(dispatch: IDispatch, variationIndex: number): void {
    updateState(dispatch, [
      lb<IState>()
        .pi("editExercise")
        .p("variations")
        .recordModify((v) => v.filter((_, i) => i !== variationIndex)),
    ]);
  }

  export function setName(dispatch: IDispatch, program: IProgram, name: string): void {
    updateState(dispatch, [lb<IState>().p("storage").p("programs").findBy("id", program.id).p("name").record(name)]);
  }

  export function setNextDay(dispatch: IDispatch, program: IProgram, nextDay: number): void {
    updateState(dispatch, [
      lb<IState>().p("storage").p("programs").findBy("id", program.id).p("nextDay").record(nextDay),
    ]);
  }

  export function reorderSets(
    dispatch: IDispatch,
    variationIndex: number,
    startSetIndex: number,
    endSetIndex: number
  ): void {
    updateState(dispatch, [
      lb<IState>()
        .pi("editExercise")
        .p("variations")
        .i(variationIndex)
        .p("sets")
        .recordModify((sets) => {
          const newSets = [...sets];
          const [setsToMove] = newSets.splice(startSetIndex, 1);
          newSets.splice(endSetIndex, 0, setsToMove);
          return newSets;
        }),
    ]);
  }

  export function setDayName(dispatch: IDispatch, program: IProgram, dayIndex: number, name: string): void {
    updateState(dispatch, [
      lb<IState>().p("storage").p("programs").findBy("id", program.id).p("days").i(dayIndex).p("name").record(name),
    ]);
  }

  export function addSet(dispatch: IDispatch, variationIndex: number): void {
    updateState(dispatch, [
      lb<IState>()
        .pi("editExercise")
        .p("variations")
        .i(variationIndex)
        .p("sets")
        .recordModify((sets) => {
          const set = { ...sets[sets.length - 1] };
          return [...sets, set];
        }),
    ]);
  }

  export function removeSet(dispatch: IDispatch, variationIndex: number, setIndex: number): void {
    updateState(dispatch, [
      lb<IState>()
        .pi("editExercise")
        .p("variations")
        .i(variationIndex)
        .p("sets")
        .recordModify((sets) => sets.filter((s, i) => i !== setIndex)),
    ]);
  }

  export function addProgramExercise(dispatch: IDispatch): void {
    updateState(dispatch, [
      lb<IState>().p("editExercise").record(Program.createExercise()),
      lb<IState>()
        .p("screenStack")
        .recordModify((stack) => Screen.push(stack, "editProgramExercise")),
    ]);
  }

  export function editProgramExercise(dispatch: IDispatch, exercise: IProgramExercise): void {
    updateState(dispatch, [
      lb<IState>().p("editExercise").record(exercise),
      lb<IState>()
        .p("screenStack")
        .recordModify((stack) => Screen.push(stack, "editProgramExercise")),
    ]);
  }

  export function removeProgramExercise(dispatch: IDispatch, program: IProgram, exerciseId: string): void {
    updateState(dispatch, [
      lb<IState>()
        .p("storage")
        .p("programs")
        .findBy("id", program.id)
        .p("exercises")
        .recordModify((es) => es.filter((e) => e.id !== exerciseId)),
    ]);
  }

  export function copyProgramExercise(dispatch: IDispatch, program: IProgram, exercise: IProgramExercise): void {
    const newName = `${exercise.name} Copy`;
    updateState(dispatch, [
      lb<IState>()
        .p("storage")
        .p("programs")
        .findBy("id", program.id)
        .p("exercises")
        .recordModify((es) => {
          const newExercise: IProgramExercise = { ...exercise, name: newName, id: UidFactory.generateUid(8) };
          return [...es, newExercise];
        }),
    ]);
  }

  export function toggleDayExercise(
    dispatch: IDispatch,
    program: IProgram,
    dayIndex: number,
    exerciseId: string
  ): void {
    updateState(dispatch, [
      lb<IState>()
        .p("storage")
        .p("programs")
        .findBy("id", program.id)
        .p("days")
        .i(dayIndex)
        .p("exercises")
        .recordModify((es) => {
          if (es.some((e) => e.id === exerciseId)) {
            return es.filter((e) => e.id !== exerciseId);
          } else {
            return [...es, { id: exerciseId }];
          }
        }),
    ]);
  }

  export function reorderDays(
    dispatch: IDispatch,
    programIndex: number,
    startDayIndex: number,
    endDayIndex: number
  ): void {
    updateState(dispatch, [
      EditProgramLenses.reorderDays(
        lb<IState>().p("storage").p("programs").i(programIndex),
        startDayIndex,
        endDayIndex
      ),
    ]);
  }

  export function reorderExercises(
    dispatch: IDispatch,
    program: IProgram,
    dayIndex: number,
    startExerciseIndex: number,
    endExceciseIndex: number
  ): void {
    updateState(dispatch, [
      EditProgramLenses.reorderExercises(
        lb<IState>().p("storage").p("programs").findBy("id", program.id),
        dayIndex,
        startExerciseIndex,
        endExceciseIndex
      ),
    ]);
  }

  export function saveExercise(dispatch: IDispatch, programIndex: number): void {
    const exerciseLensGetters = {
      editExercise: lb<IState>().p("editExercise").get(),
      state: lb<IState>().get(),
    };
    updateState(
      dispatch,
      [
        lbu<IState, typeof exerciseLensGetters>(exerciseLensGetters)
          .p("storage")
          .p("programs")
          .i(programIndex)
          .p("exercises")
          .recordModify((exc, getters) => {
            const editExercise = getters.editExercise!;
            const exercise = exc.find((e) => e.id === editExercise.id);
            if (exercise != null) {
              return exc.map((e) => (e.id === editExercise.id ? editExercise : e));
            } else {
              return [...exc, editExercise];
            }
          }),
        lbu<IState, typeof exerciseLensGetters>(exerciseLensGetters)
          .p("storage")
          .p("programs")
          .recordModify((programs, getters) => {
            if (getters.state.screenStack[getters.state.screenStack.length - 2] === "editProgramDay") {
              const dayIndex = getters.state.editProgram!.dayIndex!;
              const exerciseId = getters.editExercise!.id;
              return lf(programs)
                .i(programIndex)
                .p("days")
                .i(dayIndex)
                .p("exercises")
                .modify((es) => {
                  if (es.every((e) => e.id !== exerciseId)) {
                    return [...es, { id: exerciseId }];
                  } else {
                    return es;
                  }
                });
            } else {
              return programs;
            }
          }),
        lb<IState>()
          .p("screenStack")
          .recordModify((s) => Screen.pull(s)),
        lb<IState>().p("editExercise").record(undefined),
      ],
      "Save Exercise"
    );
  }

  export function set531Tms(dispatch: IDispatch, programIndex: number, tms: I531Tms): void {
    updateState(
      dispatch,
      ObjectUtils.keys(tms).map((exerciseId) => {
        return lb<IState>()
          .p("storage")
          .p("programs")
          .i(programIndex)
          .p("exercises")
          .find((e) => e.exerciseType.id === exerciseId)
          .p("state")
          .p("tm")
          .record(tms[exerciseId]);
      })
    );
  }

  export function updateSimpleExercise(
    dispatch: IDispatch,
    units: IUnit,
    sets?: number,
    reps?: number,
    weight?: number
  ): void {
    if (sets != null && reps != null && weight != null) {
      updateState(dispatch, [
        lb<IState>()
          .pi("editExercise")
          .p("variations")
          .i(0)
          .p("sets")
          .record(
            Array.apply(null, Array(sets)).map(() => ({
              repsExpr: reps.toString(),
              weightExpr: "state.weight",
              isAmrap: false,
            }))
          ),
        lb<IState>().pi("editExercise").p("state").p("weight").record(Weight.build(weight, units)),
      ]);
    }
  }

  export function setProgression(
    dispatch: IDispatch,
    progression?: { increment: number; unit: IUnit | "%"; attempts: number },
    deload?: { decrement: number; unit: IUnit | "%"; attempts: number }
  ): void {
    const lbs: ILensRecordingPayload<IState>[] = [];
    lbs.push(lb<IState>().pi("editExercise").p("state").p("successes").record(0));
    lbs.push(lb<IState>().pi("editExercise").p("state").p("failures").record(0));
    const finishDayExpr = [];
    if (progression != null) {
      finishDayExpr.push(
        StringUtils.unindent(`
          // Simple Exercise Progression script '${progression.increment}${progression.unit},${progression.attempts}'
          if (completedReps >= reps) {
            state.successes = state.successes + 1
            if (state.successes >= ${progression.attempts}) {
              ${
                progression.unit === "%"
                  ? `state.weight = roundWeight(state.weight * ${1 + progression.increment / 100})`
                  : `state.weight = state.weight + ${progression.increment}${progression.unit}`
              }
              state.successes = 0
              state.failures = 0
            }
          }
          // End Simple Exercise Progression script
        `)
      );
    }
    if (deload != null) {
      finishDayExpr.push(
        StringUtils.unindent(`
          // Simple Exercise Deload script '${deload.decrement}${deload.unit},${deload.attempts}'
          if (!(completedReps >= reps)) {
            state.failures = state.failures + 1
            if (state.failures >= ${deload.attempts}) {
              ${
                deload.unit === "%"
                  ? `state.weight = roundWeight(state.weight * ${1 - deload.decrement / 100})`
                  : `state.weight = state.weight - ${deload.decrement}${deload.unit}`
              }
              state.successes = 0
              state.failures = 0
            }
          }
          // End Simple Exercise Deload script
        `)
      );
    }
    lbs.push(lb<IState>().pi("editExercise").p("finishDayExpr").record(finishDayExpr.join("\n")));

    updateState(dispatch, lbs, "Setting Progression or Deload in simple exercise");
  }

  export function setDefaultWarmupSets(dispatch: IDispatch, exercise: IExercise): void {
    const defaultWarmup = (exercise.defaultWarmup && warmupValues()[exercise.defaultWarmup]) || [];
    updateWarmupSets(dispatch, defaultWarmup);
  }

  export function addWarmupSet(dispatch: IDispatch, ws: IProgramExerciseWarmupSet[]): void {
    const warmupSets = [...ws];
    const lastWarmupSet = warmupSets[warmupSets.length - 1];
    if (lastWarmupSet != null) {
      warmupSets.push({
        reps: lastWarmupSet.reps,
        threshold: Weight.clone(lastWarmupSet.threshold),
        value: typeof lastWarmupSet.value === "number" ? lastWarmupSet.value : Weight.clone(lastWarmupSet.value),
      });
    } else {
      warmupSets.push({
        reps: 5,
        threshold: Weight.build(45, "lb"),
        value: 0.8,
      });
    }
    updateWarmupSets(dispatch, warmupSets);
  }

  export function removeWarmupSet(dispatch: IDispatch, warmupSets: IProgramExerciseWarmupSet[], index: number): void {
    updateWarmupSets(dispatch, CollectionUtils.removeAt(warmupSets, index));
  }

  export function updateWarmupSet(
    dispatch: IDispatch,
    warmupSets: IProgramExerciseWarmupSet[],
    index: number,
    newWarmupSet: IProgramExerciseWarmupSet
  ): void {
    const newWarmupSets = CollectionUtils.setAt(warmupSets, index, newWarmupSet);
    updateWarmupSets(dispatch, newWarmupSets);
  }

  export function updateWarmupSets(dispatch: IDispatch, warmupSets: IProgramExerciseWarmupSet[]): void {
    updateState(dispatch, [lb<IState>().pi("editExercise").p("warmupSets").record(warmupSets)]);
  }

  export function reuseLogic(dispatch: IDispatch, allProgramExercises: IProgramExercise[], id: string): void {
    updateState(dispatch, [
      lb<IState>()
        .pi("editExercise")
        .p("reuseLogic")
        .recordModify((oldReuseLogic) => {
          const reuseProgram = allProgramExercises.filter((pe) => pe.id === id)[0];
          if (reuseProgram == null) {
            return { selected: undefined, states: oldReuseLogic?.states || {} };
          }
          const states = oldReuseLogic?.states || {};
          let state = states[id];
          if (state == null) {
            state = { ...reuseProgram.state };
          } else {
            state = ProgramExercise.mergeStates(state, reuseProgram.state);
          }
          return {
            selected: id,
            states: { ...states, [id]: state },
          };
        }),
    ]);
  }
}
