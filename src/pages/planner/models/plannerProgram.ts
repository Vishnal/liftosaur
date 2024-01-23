import { IPlannerProgramExercise, IPlannerProgramExerciseWarmupSet, IPlannerProgramProperty } from "./types";
import { parser as plannerExerciseParser } from "../plannerExerciseParser";
import {
  IPlannerEvalFullResult,
  IPlannerEvalResult,
  PlannerExerciseEvaluator,
  PlannerSyntaxError,
} from "../plannerExerciseEvaluator";
import { IAllCustomExercises, IDayData, IPlannerProgram, IPlannerProgramWeek, ISettings } from "../../../types";
import { ObjectUtils } from "../../../utils/object";
import { Exercise, IExercise } from "../../../models/exercise";
import { IPlannerExerciseEvaluatorTextWeek, PlannerExerciseEvaluatorText } from "../plannerExerciseEvaluatorText";
import { Equipment } from "../../../models/equipment";

export type IExerciseTypeToProperties = Record<string, (IPlannerProgramProperty & { dayData: Required<IDayData> })[]>;
export type IExerciseTypeToWarmupSets = Record<string, IPlannerProgramExerciseWarmupSet[] | undefined>;

export class PlannerDayDataError extends Error {
  constructor(message: string, public readonly dayData: Required<IDayData>) {
    super(message);
  }
}

export class PlannerProgram {
  public static isValid(program: IPlannerProgram, settings: ISettings): boolean {
    const evaluatedWeeks = PlannerProgram.evaluate(program, settings);
    return evaluatedWeeks.every((week) => week.every((day) => day.success));
  }

  public static getExerciseTypeToProperties(
    evaluatedWeeks: IPlannerEvalResult[][],
    customExercises: IAllCustomExercises
  ): IExerciseTypeToProperties {
    const exerciseTypeToProperties: IExerciseTypeToProperties = {};
    PlannerProgram.generateExerciseTypeAndDayData(evaluatedWeeks, customExercises, (exercise, name, dayData) => {
      exerciseTypeToProperties[name] = exerciseTypeToProperties[name] || [];
      const properties = exerciseTypeToProperties[name];
      for (const property of exercise.properties) {
        const existingProperty = properties.find((p) => p.name === property.name);
        if (
          existingProperty != null &&
          (existingProperty.fnName !== property.fnName ||
            existingProperty.fnArgs.some((a, i) => property.fnArgs[i] !== a))
        ) {
          throw new PlannerDayDataError(
            `Same property '${property.name}' is specified with different arguments in multiple weeks/days for exercise '${exercise.name}': both in ` +
              `week ${existingProperty.dayData.week + 1}, day ${existingProperty.dayData.dayInWeek + 1} ` +
              `and week ${dayData.week + 1}, day ${dayData.dayInWeek + 1}`,
            dayData
          );
        }
        properties.push({ ...property, dayData });
      }
    });
    return exerciseTypeToProperties;
  }

  public static getExerciseTypeToWarmupSets(
    evaluatedWeeks: IPlannerEvalResult[][],
    customExercises: IAllCustomExercises
  ): IExerciseTypeToWarmupSets {
    const exerciseTypeToWarmupSets: IExerciseTypeToWarmupSets = {};
    const warmupSetSchemes: Partial<Record<string, { dayData: Required<IDayData>; scheme: string }>> = {};
    PlannerProgram.generateExerciseTypeAndDayData(evaluatedWeeks, customExercises, (exercise, name, dayData) => {
      if (exercise.warmupSets == null) {
        return;
      }
      const scheme = JSON.stringify(exercise.warmupSets);
      const ws = warmupSetSchemes[name];
      if (ws != null && ws.scheme !== scheme) {
        throw new PlannerDayDataError(
          `Different warmup sets are specified in multiple weeks/days for exercise '${exercise.name}': both in ` +
            `week ${ws.dayData.week + 1}, day ${ws.dayData.dayInWeek + 1} ` +
            `and week ${dayData.week + 1}, day ${dayData.dayInWeek + 1}`,
          dayData
        );
      }
      warmupSetSchemes[name] = { scheme, dayData };
      exerciseTypeToWarmupSets[name] = exercise.warmupSets;
    });
    return exerciseTypeToWarmupSets;
  }

  private static findLastWeekExercise(
    program: IPlannerEvalResult[][],
    weekIndex: number,
    dayIndex: number,
    exercise: IPlannerProgramExercise,
    cond?: (ex: IPlannerProgramExercise) => boolean
  ): IPlannerProgramExercise | undefined {
    for (
      let i = weekIndex - 1, lastWeekDay = program[i]?.[dayIndex];
      i >= 0 && lastWeekDay != null;
      i -= 1, lastWeekDay = program[i]?.[dayIndex]
    ) {
      if (lastWeekDay.success) {
        const lastWeekExercise = lastWeekDay.data.find(
          (ex) =>
            ex.name.toLowerCase() === exercise.name.toLowerCase() &&
            ex.label?.toLowerCase() === exercise.label?.toLowerCase() &&
            ex.equipment?.toLowerCase() === exercise.equipment?.toLowerCase()
        );
        if (lastWeekExercise != null && (cond == null || cond(lastWeekExercise))) {
          return lastWeekExercise;
        }
      }
    }
    return undefined;
  }

  private static iterateOverExercises(
    program: IPlannerEvalResult[][],
    cb: (weekIndex: number, dayIndex: number, exercise: IPlannerProgramExercise) => void
  ): void {
    for (let weekIndex = 0; weekIndex < program.length; weekIndex += 1) {
      const week = program[weekIndex];
      for (let dayIndex = 0; dayIndex < week.length; dayIndex += 1) {
        const day = week[dayIndex];
        if (day?.success) {
          const exercises = day.data;
          for (const exercise of exercises) {
            cb(weekIndex, dayIndex, exercise);
          }
        }
      }
    }
  }

  public static postProcess(
    program: IPlannerEvalResult[][],
    args?: { skipDescriptionPostProcess?: boolean }
  ): IPlannerEvalResult[][] {
    this.iterateOverExercises(program, (weekIndex, dayIndex, exercise) => {
      if (!args?.skipDescriptionPostProcess) {
        if (exercise.description == null) {
          const lastWeekExercise = this.findLastWeekExercise(
            program,
            weekIndex,
            dayIndex,
            exercise,
            (ex) => ex.description != null
          );
          exercise.description = lastWeekExercise?.description;
        }
      }
    });
    this.iterateOverExercises(program, (weekIndex, dayIndex, exercise) => {
      for (const set of exercise.sets) {
        set.rpe = set.rpe ?? exercise.globals.rpe;
        set.timer = set.timer ?? exercise.globals.timer;
        set.weight = set.weight ?? exercise.globals.weight;
        set.percentage = set.percentage ?? exercise.globals.percentage;
      }
    });
    return program;
  }

  public static evaluate(
    plannerProgram: IPlannerProgram,
    settings: ISettings,
    args?: { skipDescriptionPostProcess?: boolean }
  ): IPlannerEvalResult[][] {
    let dayIndex = 0;
    let evaluatedWeeks: IPlannerEvalResult[][] = plannerProgram.weeks.map((week, weekIndex) => {
      return week.days.map((day, dayInWeekIndex) => {
        const tree = plannerExerciseParser.parse(day.exerciseText);
        const evaluator = new PlannerExerciseEvaluator(day.exerciseText, settings, "perday", {
          day: dayIndex + 1,
          dayInWeek: dayInWeekIndex + 1,
          week: weekIndex + 1,
        });
        const result = evaluator.evaluate(tree.topNode);
        dayIndex += 1;
        return result.success ? { success: true, data: result.data[0]?.days[0]?.exercises || [] } : result;
      });
    });
    dayIndex = 0;
    const errors: { error: string; dayData: Required<IDayData> }[] = [];
    const newEvaluatedWeeks = ObjectUtils.clone(evaluatedWeeks);
    plannerProgram.weeks.forEach((week, weekIndex) => {
      week.days.forEach((day, dayInWeekIndex) => {
        const tree = plannerExerciseParser.parse(day.exerciseText);
        const evaluator = new PlannerExerciseEvaluator(day.exerciseText, settings, "perday");
        const error = evaluator.postEvaluateCheck(tree.topNode, evaluatedWeeks);
        if (error) {
          newEvaluatedWeeks[weekIndex][dayInWeekIndex] = { success: false, error };
        }
      });
    });
    evaluatedWeeks = newEvaluatedWeeks;
    this.postProcess(evaluatedWeeks, args);
    try {
      PlannerProgram.getExerciseTypeToProperties(evaluatedWeeks, settings.exercises);
      PlannerProgram.getExerciseTypeToWarmupSets(evaluatedWeeks, settings.exercises);
    } catch (e) {
      if (e instanceof PlannerDayDataError) {
        errors.push({ error: e.message, dayData: e.dayData });
      } else {
        throw e;
      }
    }
    for (const error of errors) {
      evaluatedWeeks[error.dayData.week][error.dayData.dayInWeek] = {
        success: false,
        error: new PlannerSyntaxError(error.error, 0, 0, 0, 1),
      };
    }
    return evaluatedWeeks;
  }

  public static evaluateFull(fullProgramText: string, settings: ISettings): IPlannerEvalFullResult {
    const evaluator = new PlannerExerciseEvaluator(fullProgramText, settings, "full");
    const tree = plannerExerciseParser.parse(fullProgramText);
    const result = evaluator.evaluate(tree.topNode);
    if (result.success) {
      const evaluatedWeeks = result.data.map((week) =>
        week.days.map((d) => ({ success: true as const, data: d.exercises }))
      );
      const error = evaluator.postEvaluateCheck(tree.topNode, evaluatedWeeks);
      if (error) {
        return { success: false, error };
      }
    }
    return result;
  }

  public static evaluateText(fullProgramText: string): IPlannerExerciseEvaluatorTextWeek[] {
    const evaluator = new PlannerExerciseEvaluatorText(fullProgramText);
    const tree = plannerExerciseParser.parse(fullProgramText);
    return evaluator.evaluate(tree.topNode);
  }

  public static fullToWeekEvalResult(fullResult: IPlannerEvalFullResult): IPlannerEvalResult[][] {
    return fullResult.success
      ? fullResult.data.map((week) => week.days.map((d) => ({ success: true, data: d.exercises })))
      : [[fullResult]];
  }

  public static generateFullText(weeks: IPlannerProgramWeek[]): string {
    let fullText = "";
    for (const week of weeks) {
      fullText += `# ${week.name}\n`;
      for (const day of week.days) {
        fullText += `## ${day.name}\n`;
        fullText += `${day.exerciseText}\n\n`;
      }
      fullText += "\n";
    }
    return fullText;
  }

  public static generateExerciseTypeAndDayData(
    evaluatedWeeks: IPlannerEvalResult[][],
    customExercises: IAllCustomExercises,
    cb: (exercise: IPlannerProgramExercise, name: string, dayData: Required<IDayData>) => void
  ): void {
    let dayIndex = 0;
    for (let weekIndex = 0; weekIndex < evaluatedWeeks.length; weekIndex += 1) {
      const week = evaluatedWeeks[weekIndex];
      for (let dayInWeekIndex = 0; dayInWeekIndex < week.length; dayInWeekIndex += 1) {
        const day = week[dayInWeekIndex];
        if (day.success) {
          const excrs = day.data;
          const exercisesByName: Record<string, IPlannerProgramExercise[]> = {};
          for (const exercise of excrs) {
            const key = `${exercise.label}_${exercise.name}_${exercise.equipment}`.toLowerCase();
            exercisesByName[key] = exercisesByName[key] || [];
            exercisesByName[key].push(exercise);
          }
          for (const groupedExercises of ObjectUtils.values(exercisesByName)) {
            const exercise = groupedExercises.reduce((memo, ex) => {
              memo.sets.push(...ex.sets);
              return memo;
            });
            const liftosaurExercise = Exercise.findByName(exercise.name, customExercises);
            if (!liftosaurExercise) {
              continue;
            }
            const name = PlannerProgram.generateExerciseTypeKey(exercise, liftosaurExercise);
            const dayData = {
              week: weekIndex,
              day: dayIndex,
              dayInWeek: dayInWeekIndex,
            };
            cb(exercise, name, dayData);
          }
        }
        dayIndex += 1;
      }
    }
  }

  public static nameToKey(labelNameAndEquipment: string, settings: ISettings): string {
    let equip: string | undefined;
    const parts = labelNameAndEquipment.split(",");
    if (parts.length > 1) {
      equip = parts.pop();
    }
    equip = equip?.trim();
    if (equip) {
      equip = Equipment.equipmentKeyByName(equip, settings.equipment);
    }
    const nameAndLabel = parts.join(",").trim();
    const [labelOrName, ...nameParts] = nameAndLabel.split(":");
    let label: string | undefined;
    let name: string;
    if (nameParts.length === 0) {
      name = labelOrName;
      label = undefined;
    } else {
      label = labelOrName.trim();
      name = nameParts.join(":").trim();
    }
    if (equip == null) {
      const exercise = Exercise.findByName(name, settings.exercises);
      equip = exercise?.defaultEquipment;
    }
    const key = `${label ? `${label}-` : ""}${name}-${equip}`.toLowerCase();
    console.log("PlannerProgram.nameToKey", key);
    return key;
  }

  public static generateExerciseTypeKey(plannerExercise: IPlannerProgramExercise, exercise: IExercise): string {
    const equipment = plannerExercise.equipment ?? exercise.defaultEquipment;
    return `${plannerExercise.label ? `${plannerExercise.label}-` : ""}${exercise.id}-${equipment}`.toLowerCase();
  }
}
