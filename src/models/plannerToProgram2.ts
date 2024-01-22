import { PlannerProgram } from "../pages/planner/models/plannerProgram";
import { IPlannerProgramExercise, IPlannerProgramProperty } from "../pages/planner/models/types";
import {
  IPlannerProgram,
  IProgram,
  IProgramExercise,
  ISettings,
  IProgramSet,
  IProgramDay,
  IProgramWeek,
  IProgramExerciseVariation,
  IWeight,
} from "../types";
import { UidFactory } from "../utils/generator";
import { ObjectUtils } from "../utils/object";
import { Exercise } from "./exercise";
import { IProgramState, IProgramExerciseWarmupSet } from "../types";
import { Weight } from "./weight";
import { MathUtils } from "../utils/math";
import { Equipment } from "./equipment";

export class PlannerToProgram2 {
  constructor(
    private readonly programId: string,
    private readonly plannerProgram: IPlannerProgram,
    private readonly settings: ISettings
  ) {}

  public static plannerExerciseKey(exercise: IPlannerProgramExercise): string {
    return `${exercise.label || ""}-${exercise.name}-${exercise.equipment || "bodyweight"}`.toLowerCase();
  }

  public convertToProgram(): IProgram {
    const evaluatedWeeks = PlannerProgram.evaluate(this.plannerProgram, this.settings);
    const isValid = evaluatedWeeks.every((week) => week.every((day) => day.success));

    if (!isValid) {
      throw new Error("Invalid program");
    }

    const programDays: IProgramDay[] = [];
    const programWeeks: IProgramWeek[] = [];
    const keyToProgramExercise: Record<string, IProgramExercise> = {};
    const keyToProgramExerciseId: Record<string, string> = {};
    let dayIndex = 0;
    const variationIndexes: Record<string, Record<string, { count: number; current: number }>> = {};
    const descriptionIndexes: Record<string, Record<string, { count: number; current: number }>> = {};
    for (let weekIndex = 0; weekIndex < evaluatedWeeks.length; weekIndex += 1) {
      const week = evaluatedWeeks[weekIndex];
      const plannerWeek = this.plannerProgram.weeks[weekIndex];
      const programWeek: IProgramWeek = { id: UidFactory.generateUid(8), name: plannerWeek.name, days: [] };
      for (let dayInWeekIndex = 0; dayInWeekIndex < week.length; dayInWeekIndex += 1) {
        const day = week[dayInWeekIndex];
        const plannerDay = plannerWeek.days[dayInWeekIndex];
        const programDay: IProgramDay = { id: UidFactory.generateUid(8), name: plannerDay.name, exercises: [] };
        if (day.success) {
          for (const evalExercise of day.data) {
            const key = PlannerToProgram2.plannerExerciseKey(evalExercise);
            const exercise = Exercise.findByName(evalExercise.name, this.settings.exercises);
            if (!exercise) {
              throw new Error(`Exercise not found: ${evalExercise.name}`);
            }
            const programExercise: IProgramExercise = keyToProgramExercise[key] || {
              descriptions: [""],
              exerciseType: { id: exercise.id, equipment: evalExercise.equipment || "bodyweight" },
              name: `${evalExercise.label ? `${evalExercise.label}: ` : ""}${evalExercise.name}`,
              id: UidFactory.generateUid(8),
              state: {},
              variations: [],
              variationExpr: "",
              descriptionExpr: "day",
              finishDayExpr: "",
            };
            let isQuickAddSets = false;
            keyToProgramExercise[key] = programExercise;
            keyToProgramExerciseId[key] = programExercise.id;
            const newVariations: IProgramExerciseVariation[] = evalExercise.setVariations.map(
              (setVariation, setIndex) => {
                const sets: IProgramSet[] = [];
                for (const set of setVariation.sets) {
                  if (set.repRange != null) {
                    const range = set.repRange;
                    isQuickAddSets = isQuickAddSets || !!set.repRange?.isQuickAddSet;
                    let weightExpr: string = "";
                    if (set.weight) {
                      weightExpr = `${set.weight.value}${set.weight.unit}`;
                    } else if (set.percentage) {
                      weightExpr = `${set.percentage}%`;
                    } else {
                      const rpe = set.rpe || 10;
                      weightExpr = `${MathUtils.roundFloat(Weight.rpeMultiplier(set.repRange.maxrep, rpe) * 100, 2)}%`;
                    }
                    for (let i = 0; i < range.numberOfSets; i++) {
                      sets.push({
                        repsExpr: `${range.maxrep}`,
                        minRepsExpr: range.maxrep === range.minrep ? undefined : `${range.minrep}`,
                        weightExpr,
                        isAmrap: range.isAmrap,
                        logRpe: set.logRpe,
                        rpeExpr: set.rpe ? `${set.rpe}` : undefined,
                        timerExpr: set.timer ? `${set.timer}` : undefined,
                      });
                    }
                  }
                }
                variationIndexes[key] = variationIndexes[key] || {};
                variationIndexes[key][dayIndex] = variationIndexes[key][dayIndex] || { count: 0, current: 0 };
                variationIndexes[key][dayIndex].count += 1;
                if (setVariation.isCurrent) {
                  variationIndexes[key][dayIndex].current = setIndex;
                }
                return { sets };
              }
            );
            if (evalExercise.description) {
              programExercise.descriptions.push(evalExercise.description);
              descriptionIndexes[key] = descriptionIndexes[key] || {};
              descriptionIndexes[key][dayIndex] = descriptionIndexes[key][dayIndex] || { count: 0, current: 0 };
              descriptionIndexes[key][dayIndex].count += 1;
            }
            let state: IProgramState = {};
            let finishDayExpr = programExercise.finishDayExpr;
            let warmupSets: IProgramExerciseWarmupSet[] | undefined = undefined;
            if (evalExercise.warmupSets) {
              const sets: IProgramExerciseWarmupSet[] = [];
              for (const ws of evalExercise.warmupSets) {
                for (let i = 0; i < ws.numberOfSets; i += 1) {
                  let value: IWeight | number | undefined = ws.percentage ? ws.percentage / 100 : undefined;
                  if (value == null) {
                    value = ws.weight;
                  }
                  if (value == null) {
                    value = MathUtils.roundTo0005(Weight.rpeMultiplier(ws.reps, 4));
                  }
                  sets.push({
                    reps: ws.reps,
                    value,
                    threshold: Weight.build(0, this.settings.units),
                  });
                }
              }
              warmupSets = sets;
            }
            let reuseFinishDayScript: string | undefined;
            for (const property of evalExercise.properties) {
              if (property.name === "progress") {
                if (property.fnName === "custom") {
                  for (const value of property.fnArgs) {
                    const [fnArgKey, fnArgValStr] = value.split(":").map((v) => v.trim());
                    const fnArgVal = fnArgValStr.match(/(lb|kg)/)
                      ? Weight.parse(fnArgValStr)
                      : fnArgValStr.match(/%/)
                      ? Weight.buildPct(parseFloat(fnArgValStr))
                      : MathUtils.roundFloat(parseFloat(fnArgValStr), 2);
                    state[fnArgKey] = fnArgVal ?? 0;
                  }
                  if (property.script) {
                    finishDayExpr = property.script ?? "";
                  } else if (property.body) {
                    reuseFinishDayScript = property.body;
                  }
                } else if (property.fnName === "lp") {
                  ({ state, finishDayExpr } = this.addLp(property, this.settings));
                } else if (property.fnName === "dp") {
                  ({ state, finishDayExpr } = this.addDp(property, this.settings));
                } else if (property.fnName === "sum") {
                  ({ state, finishDayExpr } = this.addSum(property, this.settings));
                }
              }
            }
            programExercise.variations = programExercise.variations.concat(newVariations);
            programExercise.state = state;
            programExercise.finishDayExpr = finishDayExpr;
            programExercise.enableRpe = programExercise.variations.some((v) =>
              v.sets.some((s) => s.rpeExpr != null || !!s.logRpe)
            );
            programExercise.quickAddSets = isQuickAddSets;
            programExercise.enableRepRanges = programExercise.variations.some((v) =>
              v.sets.some((s) => s.minRepsExpr != null)
            );
            programExercise.warmupSets = warmupSets;
            programExercise.reuseFinishDayScript = programExercise.reuseFinishDayScript || reuseFinishDayScript;
            programDay.exercises.push({ id: programExercise.id });
          }
        }
        programDays.push(programDay);
        programWeek.days.push({ id: programDay.id });
        dayIndex += 1;
      }
      programWeeks.push(programWeek);
    }

    const allExercises = ObjectUtils.values(keyToProgramExercise);
    for (const exerciseKey of Object.keys(keyToProgramExercise)) {
      const programExercise = keyToProgramExercise[exerciseKey];
      const variationIndex = variationIndexes[exerciseKey];
      let index = 0;
      programExercise.variationExpr =
        ObjectUtils.keys(variationIndex)
          .map((di) => {
            const expr = `day == ${parseInt(di, 10) + 1} ? ${index + variationIndex[di].current + 1} : `;
            index += variationIndex[di].count;
            return expr;
          })
          .join("") + "1";

      index = 0;
      const descriptionIndex = descriptionIndexes[exerciseKey];
      programExercise.descriptionExpr =
        ObjectUtils.keys(descriptionIndex || {})
          .map((di) => {
            const expr = `day == ${parseInt(di, 10) + 1} ? ${index + 2} : `;
            index += variationIndex[di].count;
            return expr;
          })
          .join("") + "1";

      const reuseFinishDayScript = programExercise.reuseFinishDayScript;
      if (reuseFinishDayScript) {
        const parts = reuseFinishDayScript.split(",");
        let equip: string | undefined;
        if (parts.length > 1) {
          equip = parts.pop();
        }
        equip = equip?.trim();
        const equipKey = equip ? Equipment.equipmentKeyByName(equip, this.settings.equipment) : undefined;
        const name = parts.join(",");
        const originalProgramExercise = allExercises.find(
          (e) => e.name === name && (equipKey == null || e.exerciseType.equipment === equipKey)
        );
        programExercise.reuseFinishDayScript = originalProgramExercise?.id;
      }
    }

    const program: IProgram = {
      id: this.programId,
      name: this.plannerProgram.name,
      description: "Generated from a Workout Planner",
      url: "",
      author: "",
      nextDay: 1,
      exercises: ObjectUtils.values(keyToProgramExercise),
      days: programDays,
      weeks: programWeeks,
      isMultiweek: true,
      tags: [],
      planner: this.plannerProgram,
    };
    return program;
  }

  private addLp(
    property: IPlannerProgramProperty,
    settings: ISettings
  ): { state: IProgramState; finishDayExpr: string } {
    console.log("Property", property);
    const increment = property.fnArgs[0] ?? (settings.units === "kg" ? "2.5kg" : "5lb");
    const totalSuccesses = parseInt(property.fnArgs[1] ?? "1", 10);
    const currentSuccesses = parseInt(property.fnArgs[2] ?? "0", 10);
    const decrement = property.fnArgs[3] ?? (settings.units === "kg" ? "5kg" : "10lb");
    const totalFailures = parseInt(property.fnArgs[4] ?? "0", 10);
    const currentFailures = parseInt(property.fnArgs[5] ?? "0", 10);
    const state: IProgramState = {};
    state.successes = currentSuccesses;
    state.failures = currentFailures;
    let finishDayExpr = `// progress: lp(${increment}, ${totalSuccesses}, ${currentSuccesses}, ${decrement}, ${totalFailures}, ${currentFailures})\n`;
    if (totalSuccesses > 0) {
      finishDayExpr += `if (completedReps >= reps && completedRPE <= RPE) {
  state.successes += 1;
  if (state.successes >= ${totalSuccesses}) {
    weights += ${increment}
    state.successes = 0
    state.failures = 0
  }
}`;
    }
    if (totalFailures > 0) {
      finishDayExpr += `\nif (!(completedReps >= reps && completedRPE <= RPE)) {
  state.failures += 1;
  if (state.failures >= ${totalFailures}) {
    weights -= ${decrement}
    state.failures = 0
    state.successes = 0
  }
}`;
    }
    return { state, finishDayExpr };
  }

  private addDp(
    property: IPlannerProgramProperty,
    settings: ISettings
  ): { state: IProgramState; finishDayExpr: string } {
    console.log("Property", property);
    const increment = property.fnArgs[0] ?? (settings.units === "kg" ? "2.5kg" : "5lb");
    const minReps = parseInt(property.fnArgs[1], 10);
    const maxReps = parseInt(property.fnArgs[2], 10);
    let finishDayExpr = `// progress: ${property.fnName}(${property.fnArgs.join(", ")})\n`;
    finishDayExpr += `if (completedReps >= reps && completedRPE <= RPE) {
  if (reps[ns] < ${maxReps}) {
    reps += 1
  } else {
    reps = ${minReps}
    weights += ${increment}
  }
}`;
    return { state: {}, finishDayExpr };
  }

  private addSum(
    property: IPlannerProgramProperty,
    settings: ISettings
  ): { state: IProgramState; finishDayExpr: string } {
    console.log("Property", property);
    const sumReps = parseInt(property.fnArgs[0], 10);
    const increment = property.fnArgs[1] ?? (settings.units === "kg" ? "2.5kg" : "5lb");
    let finishDayExpr = `// progress: ${property.fnName}(${property.fnArgs.join(", ")})\n`;
    finishDayExpr += `if (sum(completedReps) >= ${sumReps}) {
    weights += ${increment}
  }`;
    return { state: {}, finishDayExpr };
  }
}
