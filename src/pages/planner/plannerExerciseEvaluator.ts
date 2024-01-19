// import util from "util";
import { SyntaxNode } from "@lezer/common";
import { Exercise, equipmentName } from "../../models/exercise";
import { CollectionUtils } from "../../utils/collection";
import { IEither } from "../../utils/types";
import {
  IPlannerProgramExercise,
  IPlannerProgramExerciseRepRange,
  IPlannerProgramExerciseSet,
  IPlannerProgramExerciseSetVariation,
  IPlannerProgramProperty,
} from "./models/types";
import { IAllCustomExercises, IWeight, IAllEquipment } from "../../types";
import * as W from "../../models/weight";
import { IPlannerProgramExerciseWarmupSet } from "./models/types";
import { PlannerNodeName } from "./plannerExerciseStyles";
import { ObjectUtils } from "../../utils/object";
import { Equipment } from "../../models/equipment";

export class PlannerSyntaxError extends SyntaxError {
  public readonly line: number;
  public readonly offset: number;
  public readonly from: number;
  public readonly to: number;

  constructor(message: string, line: number, offset: number, from: number, to: number) {
    super(message);
    this.line = line;
    this.offset = offset;
    this.from = from;
    this.to = to;
  }
}

export type IPlannerEvalResult = IEither<IPlannerProgramExercise[], PlannerSyntaxError>;
export type IPlannerEvalFullResult = IEither<IPlannerExerciseEvaluatorWeek[], PlannerSyntaxError>;

function getChildren(node: SyntaxNode): SyntaxNode[] {
  const cur = node.cursor();
  const result: SyntaxNode[] = [];
  if (!cur.firstChild()) {
    return result;
  }
  do {
    result.push(cur.node);
  } while (cur.nextSibling());
  return result;
}

function assert(name: string): never {
  throw new PlannerSyntaxError(`Missing required nodes for ${name}, this should never happen`, 0, 0, 0, 1);
}

export interface IPlannerExerciseEvaluatorWeek {
  name: string;
  line: number;
  days: { name: string; line: number; exercises: IPlannerProgramExercise[] }[];
}

export class PlannerExerciseEvaluator {
  private readonly script: string;
  private readonly customExercises: IAllCustomExercises;
  private readonly equipment: IAllEquipment;
  private readonly mode: "perday" | "full";
  private weeks: IPlannerExerciseEvaluatorWeek[] = [];

  private latestDescription: string | undefined = undefined;

  constructor(script: string, customExercises: IAllCustomExercises, equipment: IAllEquipment, mode: "perday" | "full") {
    this.script = script;
    this.customExercises = customExercises;
    this.mode = mode;
    this.equipment = equipment;
  }

  private getValue(node: SyntaxNode): string {
    return this.getValueTrim(node).replace(/\n/g, "\\n").replace(/\t/g, "\\t");
  }

  private getValueTrim(node: SyntaxNode): string {
    return this.script.slice(node.from, node.to);
  }

  private error(message: string, node: SyntaxNode): never {
    const [line, offset] = this.getLineAndOffset(node);
    throw new PlannerSyntaxError(`${message} (${line}:${offset})`, line, offset, node.from, node.to);
  }

  private getLineAndOffset(node: SyntaxNode): [number, number] {
    const linesLengths = this.script.split("\n").map((l) => l.length + 1);
    let offset = 0;
    for (let i = 0; i < linesLengths.length; i++) {
      const lineLength = linesLengths[i];
      if (node.from >= offset && node.from < offset + lineLength) {
        return [i + 1, node.from - offset];
      }
      offset += lineLength;
    }
    return [linesLengths.length, linesLengths[linesLengths.length - 1]];
  }

  public parse(expr: SyntaxNode): void {
    const cursor = expr.cursor();
    do {
      if (cursor.node.type.isError) {
        this.error("Syntax error", cursor.node);
      }
    } while (cursor.next());
  }

  private getWarmupReps(setParts: string): { numberOfSets: number; reps: number } {
    let [numberOfSetsStr, repsStr] = setParts.split("x", 2);
    if (!numberOfSetsStr) {
      return { numberOfSets: 1, reps: 1 };
    }
    if (!repsStr) {
      repsStr = numberOfSetsStr;
      numberOfSetsStr = "1";
    }
    return {
      reps: parseInt(repsStr, 10),
      numberOfSets: parseInt(numberOfSetsStr, 10),
    };
  }

  private getRepRange(setParts: string): IPlannerProgramExerciseRepRange | undefined {
    let [numberOfSetsStr, repRangeStr] = setParts.split("x", 2);
    if (!numberOfSetsStr) {
      return undefined;
    }
    if (!repRangeStr) {
      repRangeStr = numberOfSetsStr;
      numberOfSetsStr = "1";
    }
    // eslint-disable-next-line prefer-const
    let [minrepStr, maxrepStr] = repRangeStr.split("-", 2);
    if (!maxrepStr) {
      maxrepStr = minrepStr;
    }
    let isAmrap = false;
    if (maxrepStr.endsWith("+")) {
      isAmrap = true;
      maxrepStr.replace(/\+/g, "");
    }
    return {
      numberOfSets: parseInt(numberOfSetsStr, 10),
      minrep: parseInt(minrepStr, 10),
      maxrep: parseInt(maxrepStr, 10),
      isAmrap: isAmrap,
    };
  }

  private getWeight(expr?: SyntaxNode | null): IWeight | undefined {
    if (expr?.type.name === PlannerNodeName.Weight) {
      const value = this.getValue(expr);
      const unit = value.indexOf("kg") !== -1 ? "kg" : "lb";
      return W.Weight.build(parseFloat(value), unit);
    } else {
      return undefined;
    }
  }

  private evaluateWarmupSet(expr: SyntaxNode): IPlannerProgramExerciseWarmupSet {
    if (expr.type.name === PlannerNodeName.WarmupExerciseSet) {
      const setPartNodes = expr.getChildren(PlannerNodeName.WarmupSetPart);
      const setParts = setPartNodes.map((setPartNode) => this.getValue(setPartNode)).join("");
      const { numberOfSets, reps } = this.getWarmupReps(setParts);
      const percentageNode = expr.getChild(PlannerNodeName.Percentage);
      const weightNode = expr.getChild(PlannerNodeName.Weight);
      const percentage =
        percentageNode == null ? undefined : parseFloat(this.getValue(percentageNode).replace("%", ""));
      const weight = this.getWeight(weightNode);
      if (percentage) {
        return {
          type: "warmup",
          reps,
          numberOfSets,
          percentage,
        };
      } else {
        return {
          type: "warmup",
          reps,
          numberOfSets,
          weight: weight!,
        };
      }
    } else {
      assert(PlannerNodeName.ExerciseSection);
    }
  }

  private evaluateSet(expr: SyntaxNode): IPlannerProgramExerciseSet {
    if (expr.type.name === PlannerNodeName.ExerciseSet) {
      const setPartNodes = expr.getChildren(PlannerNodeName.SetPart);
      const setParts = setPartNodes.map((setPartNode) => this.getValue(setPartNode)).join("");
      const repRange = this.getRepRange(setParts);
      const rpeNode = expr.getChild(PlannerNodeName.Rpe);
      const timerNode = expr.getChild(PlannerNodeName.Timer);
      const percentageNode = expr.getChild(PlannerNodeName.Percentage);
      const weightNode = expr.getChild(PlannerNodeName.Weight);
      const logRpe = rpeNode == null ? undefined : this.getValue(rpeNode).indexOf("+") !== -1;
      const rpe = rpeNode == null ? undefined : parseFloat(this.getValue(rpeNode).replace("@", "").replace("+", ""));
      const timer = timerNode == null ? undefined : parseInt(this.getValue(timerNode).replace("s", ""), 10);
      const percentage =
        percentageNode == null ? undefined : parseFloat(this.getValue(percentageNode).replace("%", ""));
      const weight = this.getWeight(weightNode);
      return {
        repRange,
        timer,
        logRpe,
        rpe,
        weight,
        percentage,
      };
    } else {
      assert(PlannerNodeName.ExerciseSection);
    }
  }

  private evaluateProgress(expr: SyntaxNode): IPlannerProgramProperty {
    if (expr.type.name === PlannerNodeName.ExerciseProperty) {
      const valueNode = expr.getChild(PlannerNodeName.FunctionExpression);
      if (valueNode == null) {
        throw this.error(`Missing value for the property 'progress'`, expr);
      }
      const fnNameNode = valueNode.getChild(PlannerNodeName.FunctionName);
      if (fnNameNode == null) {
        assert(PlannerNodeName.FunctionName);
      }
      const fnName = this.getValue(fnNameNode);
      if (["lp", "sum", "dp", "custom"].indexOf(fnName) === -1) {
        this.error(`There's no such progression exists - '${fnName}'`, fnNameNode);
      }
      const fnArgs = valueNode.getChildren(PlannerNodeName.FunctionArgument).map((argNode) => this.getValue(argNode));
      let script: string | undefined;
      let body: string | undefined;
      if (fnName === "lp") {
        if (fnArgs.length > 4) {
          this.error(`Linear Progression 'lp' only has 4 arguments max`, valueNode);
        } else if (fnArgs[0] && !fnArgs[0].endsWith("lb") && !fnArgs[0].endsWith("kg") && !fnArgs[0].endsWith("%")) {
          this.error(
            `1st argument of 'lp' should be weight (ending with 'lb' or 'kg') or percentage (ending with '%'). For example '10lb' or '30%'.`,
            valueNode
          );
        } else if (fnArgs[1] != null && isNaN(parseInt(fnArgs[1], 10))) {
          this.error(`2nd argument of 'lp' should be a number of attempts - i.e. a number`, valueNode);
        } else if (
          fnArgs[2] != null &&
          !fnArgs[2].endsWith("lb") &&
          !fnArgs[2].endsWith("kg") &&
          !fnArgs[2].endsWith("%")
        ) {
          this.error(
            `3rd argument of 'lp' should be weight (ending with 'lb' or 'kg') or percentage (ending with '%'). For example '10lb' or '30%'.`,
            valueNode
          );
        } else if (fnArgs[3] != null && isNaN(parseInt(fnArgs[3], 10))) {
          this.error(`4th argument of 'lp' should be a number of attempts - i.e. a number`, valueNode);
        }
      } else if (fnName === "sum") {
        if (fnArgs.length > 2) {
          this.error(`Reps Sum Progression 'sum' only has 2 arguments max`, valueNode);
        } else if (fnArgs[0] == null || isNaN(parseInt(fnArgs[0], 10))) {
          this.error(`1st argument of 'sum' should be a number of reps - i.e. a number`, valueNode);
        } else if (
          fnArgs[1] == null ||
          (!fnArgs[1].endsWith("lb") && !fnArgs[1].endsWith("kg") && !fnArgs[1].endsWith("%"))
        ) {
          this.error(
            `2nd argument of 'sum' should be weight (ending with 'lb' or 'kg') or percentage (ending with '%'). For example '10lb' or '30%'.`,
            valueNode
          );
        }
      } else if (fnName === "dp") {
        if (fnArgs.length > 2) {
          this.error(`Double Progression 'dp' only has 2 arguments max`, valueNode);
        } else if (fnArgs[0] == null || isNaN(parseInt(fnArgs[0], 10))) {
          this.error(`1st argument of 'dp' should be a range of reps - i.e. a number`, valueNode);
        } else if (
          fnArgs[1] == null ||
          (!fnArgs[1].endsWith("lb") && !fnArgs[1].endsWith("kg") && !fnArgs[1].endsWith("%"))
        ) {
          this.error(
            `2nd argument of 'dp' should be weight (ending with 'lb' or 'kg') or percentage (ending with '%'). For example '10lb' or '30%'.`,
            valueNode
          );
        }
      } else if (fnName === "custom") {
        const liftoscriptNode = valueNode.getChild(PlannerNodeName.Liftoscript);
        script = liftoscriptNode ? this.getValue(liftoscriptNode) : undefined;
        const reuseLiftoscriptNode = valueNode
          .getChild(PlannerNodeName.ReuseLiftoscript)
          ?.getChild(PlannerNodeName.ReuseSection)
          ?.getChild(PlannerNodeName.ExerciseName);
        body = reuseLiftoscriptNode ? this.getValue(reuseLiftoscriptNode) : undefined;
        if (!script && !body) {
          this.error(
            `'custom' progression requires either to specify Liftoscript block or specify which one to reuse`,
            valueNode
          );
        }
      }
      return {
        name: "progress",
        fnName,
        fnArgs: fnArgs,
        script,
        body,
      };
    } else {
      assert(PlannerNodeName.ExerciseProperty);
    }
  }

  private evaluateWarmup(expr: SyntaxNode): IPlannerProgramExerciseWarmupSet[] {
    if (expr.type.name === PlannerNodeName.ExerciseProperty) {
      const setsNode = expr.getChild(PlannerNodeName.WarmupExerciseSets);
      if (setsNode != null) {
        const none = setsNode.getChild(PlannerNodeName.None);
        if (none != null) {
          return [];
        }
        const sets = setsNode.getChildren(PlannerNodeName.WarmupExerciseSet);
        if (sets.length > 0) {
          return sets.map((set) => this.evaluateWarmupSet(set));
        }
      }
      return [];
    } else {
      assert(PlannerNodeName.ExerciseProperty);
    }
  }

  private evaluateProperty(
    expr: SyntaxNode
  ):
    | { type: "progress"; data: IPlannerProgramProperty }
    | { type: "warmup"; data: IPlannerProgramExerciseWarmupSet[] } {
    if (expr.type.name === PlannerNodeName.ExerciseProperty) {
      const nameNode = expr.getChild(PlannerNodeName.ExercisePropertyName);
      if (nameNode == null) {
        assert(PlannerNodeName.ExercisePropertyName);
      }
      const name = this.getValue(nameNode);
      if (name === "progress") {
        return { type: "progress", data: this.evaluateProgress(expr) };
      } else if (name === "warmup") {
        return { type: "warmup", data: this.evaluateWarmup(expr) };
      } else {
        this.error(`There's no such property exists - '${name}'`, nameNode);
      }
    } else {
      assert(PlannerNodeName.ExerciseProperty);
    }
  }

  private evaluateSection(
    expr: SyntaxNode
  ):
    | { type: "sets"; data: IPlannerProgramExerciseSet[]; isCurrent: boolean }
    | { type: "progress"; data: IPlannerProgramProperty }
    | { type: "warmup"; data: IPlannerProgramExerciseWarmupSet[] }
    | { type: "reuse" } {
    if (expr.type.name === PlannerNodeName.ExerciseSection) {
      const setsNode = expr.getChild(PlannerNodeName.ExerciseSets);
      if (setsNode != null) {
        const sets = setsNode.getChildren(PlannerNodeName.ExerciseSet);
        const isCurrent = setsNode.getChild(PlannerNodeName.CurrentVariation) != null;
        if (sets.length > 0) {
          return { type: "sets", data: sets.map((set) => this.evaluateSet(set)), isCurrent };
        }
      }
      const reuseNode = expr.getChild(PlannerNodeName.ReuseSection);
      if (reuseNode != null) {
        return { type: "reuse" };
      }
      const property = expr.getChild(PlannerNodeName.ExerciseProperty);
      if (property != null) {
        return this.evaluateProperty(property);
      } else {
        assert(PlannerNodeName.ExerciseProperty);
      }
    } else {
      assert(PlannerNodeName.ExerciseSection);
    }
  }

  private extractNameParts(str: string): { name: string; label?: string; equipment?: string } {
    let [label, ...nameEquipmentItems] = str.split(":");
    if (nameEquipmentItems.length === 0) {
      nameEquipmentItems = [label];
      label = "";
    } else {
      label = label.trim();
    }
    const nameEquipment = nameEquipmentItems.join(":");
    let equipment: string | undefined;
    const parts = nameEquipment.split(",");
    if (parts.length > 1) {
      const potentialEquipment = parts[parts.length - 1]?.trim();
      const allowedEquipments = [
        ...ObjectUtils.keys(this.equipment),
        ...ObjectUtils.keys(this.equipment).map((e) => equipmentName(e, this.equipment)),
      ];
      if (potentialEquipment != null && allowedEquipments.indexOf(potentialEquipment) !== -1) {
        const equipmentKey = Equipment.equipmentKeyByName(potentialEquipment, this.equipment);
        equipment = equipmentKey;
        parts.pop();
      }
    }
    const name = parts.join(",").trim();
    return { name, label: label ? label : undefined, equipment };
  }

  private addLineComment(value: string): void {
    value = value.replace(/^\/\//, "").trim();
    this.latestDescription = this.latestDescription || "";
    this.latestDescription += value + "\n";
  }

  private evaluateExercise(expr: SyntaxNode): void {
    if (expr.type.name === PlannerNodeName.EmptyExpression || expr.type.name === PlannerNodeName.TripleLineComment) {
      return;
    } else if (expr.type.name === PlannerNodeName.Week) {
      if (this.mode === "perday") {
        this.error(
          `You cannot specify weeks in the per-day exercise lists. Switch to the full program mode for that.`,
          expr
        );
      }
      const weekName = this.getValueTrim(expr).replace(/^#+/, "").trim();
      const [line] = this.getLineAndOffset(expr);
      this.weeks.push({ name: weekName, line, days: [] });
    } else if (expr.type.name === PlannerNodeName.Day) {
      if (this.mode === "perday") {
        this.error(
          `You cannot specify days in the per-day exercise lists. Switch to the full program mode for that.`,
          expr
        );
      }
      if (this.weeks.length === 0) {
        this.error(`You need to specify a week before a day`, expr);
      }
      const dayName = this.getValueTrim(expr).replace(/^#+/, "").trim();
      const [line] = this.getLineAndOffset(expr);
      this.weeks[this.weeks.length - 1].days.push({ name: dayName, line, exercises: [] });
    } else if (expr.type.name === PlannerNodeName.LineComment) {
      const value = this.getValueTrim(expr);
      this.addLineComment(value);
      return undefined;
    } else if (expr.type.name === PlannerNodeName.ExerciseExpression) {
      if (this.mode === "full" && (this.weeks.length === 0 || this.weeks[this.weeks.length - 1].days.length === 0)) {
        this.error(`You should first define a week and a day before listing exercises.`, expr);
      } else if (this.weeks.length === 0) {
        this.weeks.push({ name: "Week 1", line: 1, days: [{ name: "Day 1", line: 1, exercises: [] }] });
      }
      const nameNode = expr.getChild(PlannerNodeName.ExerciseName);
      if (nameNode == null) {
        assert("ExerciseName");
      }
      // eslint-disable-next-line prefer-const
      let { label, name, equipment } = this.extractNameParts(this.getValue(nameNode));
      const exercise = Exercise.findByName(name, this.customExercises);
      if (exercise == null) {
        this.error(`Unknown exercise ${name}`, nameNode);
      }
      equipment = equipment || exercise.defaultEquipment;
      const sectionNodes = expr.getChildren(PlannerNodeName.ExerciseSection);
      const setVariations: IPlannerProgramExerciseSetVariation[] = [];
      const allSets: IPlannerProgramExerciseSet[] = [];
      let allWarmupSets: IPlannerProgramExerciseWarmupSet[] | undefined;
      const allProperties: IPlannerProgramProperty[] = [];
      let isReusing = false;
      for (const sectionNode of sectionNodes) {
        const section = this.evaluateSection(sectionNode);
        if (section.type === "sets") {
          allSets.push(...section.data);
          if (section.data.some((set) => set.repRange != null)) {
            setVariations.push({ sets: section.data, isCurrent: section.isCurrent });
          }
        } else if (section.type === "warmup") {
          allWarmupSets = allWarmupSets || [];
          allWarmupSets.push(...section.data);
        } else if (section.type === "progress") {
          allProperties.push(section.data);
        } else if (section.type === "reuse") {
          isReusing = true;
        } else {
          throw new Error(`Unexpected section type`);
        }
      }
      const rpe = allSets.find((set) => set.repRange == null && set.rpe != null)?.rpe;
      const timer = allSets.find((set) => set.repRange == null && set.timer != null)?.timer;
      const percentage = allSets.find((set) => set.repRange == null && set.percentage != null)?.percentage;
      const weight = allSets.find((set) => set.repRange == null && set.weight != null)?.weight;
      const logRpe = allSets.find((set) => set.repRange == null && set.logRpe != null)?.logRpe;
      const [line] = this.getLineAndOffset(expr);
      let description: string | undefined;
      if (this.latestDescription) {
        description = this.latestDescription.trim();
        this.latestDescription = undefined;
      }

      const plannerExercise: IPlannerProgramExercise = {
        label,
        name,
        equipment,
        line,
        sets: allSets,
        setVariations,
        description,
        reuse: isReusing,
        warmupSets: allWarmupSets,
        properties: allProperties,
        globals: {
          rpe,
          logRpe,
          timer,
          percentage,
          weight,
        },
      };
      this.weeks[this.weeks.length - 1].days[this.weeks[this.weeks.length - 1].days.length - 1].exercises.push(
        plannerExercise
      );
    } else {
      this.error(`Unexpected node type ${expr.node.type.name}`, expr);
    }
  }

  private evaluateProgram(expr: SyntaxNode): IPlannerExerciseEvaluatorWeek[] {
    if (expr.type.name === PlannerNodeName.Program) {
      this.weeks = [];
      for (const child of CollectionUtils.compact(getChildren(expr))) {
        this.evaluateExercise(child);
      }
      return this.weeks;
    } else {
      this.error(`Unexpected node type ${expr.node.type.name}`, expr);
    }
  }

  public evaluate(programNode: SyntaxNode): IPlannerEvalFullResult {
    try {
      this.parse(programNode);
      const program = this.evaluateProgram(programNode);
      console.log(program);
      return { data: program, success: true };
    } catch (e) {
      if (e instanceof PlannerSyntaxError) {
        return { error: e, success: false };
      } else {
        throw e;
      }
    }
  }
}
