import { ISettings, IProgramContentSettings, IPlannerSettings } from "../types";
import { Weight } from "./weight";

export namespace Settings {
  export function programContentBuild(): IProgramContentSettings {
    return {
      timers: {
        warmup: 90,
        workout: 180,
      },
      units: "lb",
    };
  }

  export function build(): ISettings {
    return {
      ...programContentBuild(),
      graphsSettings: {
        isSameXAxis: false,
        isWithBodyweight: false,
        isWithOneRm: true,
      },
      exerciseData: {},
      graphOptions: {},
      exerciseStatsSettings: {
        ascendingSort: false,
      },
      volume: 1.0,
      vibration: false,
      lengthUnits: "in",
      statsEnabled: { weight: { weight: true }, length: {}, percentage: {} },
      equipment: {
        barbell: {
          multiplier: 2,
          bar: {
            lb: Weight.build(45, "lb"),
            kg: Weight.build(20, "kg"),
          },
          plates: [
            { weight: Weight.build(45, "lb"), num: 8 },
            { weight: Weight.build(25, "lb"), num: 4 },
            { weight: Weight.build(10, "lb"), num: 4 },
            { weight: Weight.build(5, "lb"), num: 4 },
            { weight: Weight.build(2.5, "lb"), num: 4 },
            { weight: Weight.build(1.25, "lb"), num: 2 },
            { weight: Weight.build(20, "kg"), num: 8 },
            { weight: Weight.build(10, "kg"), num: 4 },
            { weight: Weight.build(5, "kg"), num: 4 },
            { weight: Weight.build(2.5, "kg"), num: 4 },
            { weight: Weight.build(1.25, "kg"), num: 4 },
            { weight: Weight.build(0.5, "kg"), num: 2 },
          ],
          fixed: [],
          isFixed: false,
        },
        trapbar: {
          multiplier: 2,
          bar: {
            lb: Weight.build(45, "lb"),
            kg: Weight.build(20, "kg"),
          },
          plates: [
            { weight: Weight.build(45, "lb"), num: 8 },
            { weight: Weight.build(25, "lb"), num: 4 },
            { weight: Weight.build(10, "lb"), num: 4 },
            { weight: Weight.build(5, "lb"), num: 4 },
            { weight: Weight.build(2.5, "lb"), num: 4 },
            { weight: Weight.build(1.25, "lb"), num: 2 },
            { weight: Weight.build(20, "kg"), num: 8 },
            { weight: Weight.build(10, "kg"), num: 4 },
            { weight: Weight.build(5, "kg"), num: 4 },
            { weight: Weight.build(2.5, "kg"), num: 4 },
            { weight: Weight.build(1.25, "kg"), num: 4 },
            { weight: Weight.build(0.5, "kg"), num: 2 },
          ],
          fixed: [],
          isFixed: false,
        },
        leverageMachine: {
          multiplier: 1,
          bar: {
            lb: Weight.build(0, "lb"),
            kg: Weight.build(0, "kg"),
          },
          plates: [
            { weight: Weight.build(45, "lb"), num: 8 },
            { weight: Weight.build(25, "lb"), num: 4 },
            { weight: Weight.build(10, "lb"), num: 4 },
            { weight: Weight.build(5, "lb"), num: 4 },
            { weight: Weight.build(2.5, "lb"), num: 4 },
            { weight: Weight.build(1.25, "lb"), num: 2 },
            { weight: Weight.build(20, "kg"), num: 8 },
            { weight: Weight.build(10, "kg"), num: 4 },
            { weight: Weight.build(5, "kg"), num: 4 },
            { weight: Weight.build(2.5, "kg"), num: 4 },
            { weight: Weight.build(1.25, "kg"), num: 4 },
            { weight: Weight.build(0.5, "kg"), num: 2 },
          ],
          fixed: [],
          isFixed: false,
        },
        smith: {
          multiplier: 2,
          bar: {
            lb: Weight.build(45, "lb"),
            kg: Weight.build(20, "kg"),
          },
          plates: [
            { weight: Weight.build(45, "lb"), num: 8 },
            { weight: Weight.build(25, "lb"), num: 4 },
            { weight: Weight.build(10, "lb"), num: 4 },
            { weight: Weight.build(5, "lb"), num: 4 },
            { weight: Weight.build(2.5, "lb"), num: 4 },
            { weight: Weight.build(1.25, "lb"), num: 2 },
            { weight: Weight.build(20, "kg"), num: 8 },
            { weight: Weight.build(10, "kg"), num: 4 },
            { weight: Weight.build(5, "kg"), num: 4 },
            { weight: Weight.build(2.5, "kg"), num: 4 },
            { weight: Weight.build(1.25, "kg"), num: 4 },
            { weight: Weight.build(0.5, "kg"), num: 2 },
          ],
          fixed: [],
          isFixed: false,
        },
        dumbbell: {
          multiplier: 2,
          bar: {
            lb: Weight.build(10, "lb"),
            kg: Weight.build(5, "kg"),
          },
          plates: [
            { weight: Weight.build(10, "lb"), num: 8 },
            { weight: Weight.build(5, "lb"), num: 4 },
            { weight: Weight.build(2.5, "lb"), num: 4 },
            { weight: Weight.build(1.25, "lb"), num: 2 },
            { weight: Weight.build(5, "kg"), num: 8 },
            { weight: Weight.build(2.5, "kg"), num: 4 },
            { weight: Weight.build(1.25, "kg"), num: 4 },
            { weight: Weight.build(0.5, "kg"), num: 2 },
          ],
          fixed: [
            Weight.build(10, "lb"),
            Weight.build(15, "lb"),
            Weight.build(20, "lb"),
            Weight.build(25, "lb"),
            Weight.build(30, "lb"),
            Weight.build(35, "lb"),
            Weight.build(40, "lb"),
            Weight.build(4, "kg"),
            Weight.build(6, "kg"),
            Weight.build(8, "kg"),
            Weight.build(10, "kg"),
            Weight.build(12, "kg"),
            Weight.build(14, "kg"),
            Weight.build(20, "kg"),
          ],
          isFixed: false,
        },
        ezbar: {
          multiplier: 2,
          bar: {
            lb: Weight.build(20, "lb"),
            kg: Weight.build(10, "kg"),
          },
          plates: [
            { weight: Weight.build(45, "lb"), num: 8 },
            { weight: Weight.build(25, "lb"), num: 4 },
            { weight: Weight.build(10, "lb"), num: 4 },
            { weight: Weight.build(5, "lb"), num: 4 },
            { weight: Weight.build(2.5, "lb"), num: 4 },
            { weight: Weight.build(1.25, "lb"), num: 2 },
            { weight: Weight.build(20, "kg"), num: 8 },
            { weight: Weight.build(10, "kg"), num: 4 },
            { weight: Weight.build(5, "kg"), num: 4 },
            { weight: Weight.build(2.5, "kg"), num: 4 },
            { weight: Weight.build(1.25, "kg"), num: 4 },
            { weight: Weight.build(0.5, "kg"), num: 2 },
          ],
          fixed: [],
          isFixed: false,
        },
        cable: {
          multiplier: 1,
          bar: {
            lb: Weight.build(0, "lb"),
            kg: Weight.build(0, "kg"),
          },
          plates: [
            {
              weight: Weight.build(10, "lb"),
              num: 20,
            },
            {
              weight: Weight.build(5, "lb"),
              num: 10,
            },
            {
              weight: Weight.build(5, "kg"),
              num: 20,
            },
            {
              weight: Weight.build(2.5, "kg"),
              num: 10,
            },
          ],
          fixed: [],
          isFixed: false,
        },
        kettlebell: {
          multiplier: 1,
          bar: {
            lb: Weight.build(0, "lb"),
            kg: Weight.build(0, "kg"),
          },
          plates: [],
          fixed: [
            Weight.build(10, "lb"),
            Weight.build(15, "lb"),
            Weight.build(20, "lb"),
            Weight.build(25, "lb"),
            Weight.build(30, "lb"),
            Weight.build(35, "lb"),
            Weight.build(40, "lb"),
            Weight.build(4, "kg"),
            Weight.build(8, "kg"),
            Weight.build(12, "kg"),
            Weight.build(16, "kg"),
            Weight.build(24, "kg"),
          ],
          isFixed: true,
        },
      },
      shouldShowFriendsHistory: true,
      exercises: {},
      graphs: [],
      planner: buildPlannerSettings(),
    };
  }

  export function buildPlannerSettings(): IPlannerSettings {
    return {
      strengthSetsPct: 30,
      hypertrophySetsPct: 70,
      weeklyRangeSets: {
        shoulders: [10, 12],
        triceps: [10, 12],
        back: [10, 12],
        abs: [10, 12],
        glutes: [10, 12],
        hamstrings: [10, 12],
        quadriceps: [10, 12],
        chest: [10, 12],
        biceps: [10, 12],
        calves: [10, 12],
        forearms: [10, 12],
      },
      weeklyFrequency: {
        shoulders: 2,
        triceps: 2,
        back: 2,
        abs: 2,
        glutes: 2,
        hamstrings: 2,
        quadriceps: 2,
        chest: 2,
        biceps: 2,
        calves: 2,
        forearms: 2,
      },
      synergistMultiplier: 0.5,
    };
  }
}
