/* eslint-disable @typescript-eslint/no-explicit-any */

import { CollectionUtils } from "../utils/collection";
import { History } from "../models/history";
import { UidFactory } from "../utils/generator";
import { ObjectUtils } from "../utils/object";
import { IStorage, IExerciseId } from "../types";
import { Weight } from "../models/weight";
import { SendMessage } from "../utils/sendMessage";
import { Settings } from "../models/settings";

let latestMigrationVersion: number | undefined;
export function getLatestMigrationVersion(): string {
  if (latestMigrationVersion == null) {
    latestMigrationVersion = CollectionUtils.sort(
      Object.keys(migrations).map((v) => parseInt(v, 10)),
      (a, b) => b - a
    )[0];
  }
  return latestMigrationVersion.toString();
}

export const migrations = {
  "20200929231430_add_helps_to_storage": async (client: Window["fetch"], aStorage: IStorage): Promise<IStorage> => {
    const storage: any = JSON.parse(JSON.stringify(aStorage));
    storage.helps = [];
    return storage;
  },
  "20201111073526_rename_exercise_bar_to_exercise_equipment": async (
    client: Window["fetch"],
    aStorage: IStorage
  ): Promise<IStorage> => {
    const storage: IStorage = JSON.parse(JSON.stringify(aStorage));
    for (const historyRecord of storage.history) {
      for (const entry of historyRecord.entries) {
        if ("bar" in (entry as any).exercise) {
          entry.exercise.equipment = (entry as any).exercise.bar;
          delete (entry as any).exercise.bar;
        }
      }
    }
    for (const program of storage.programs) {
      for (const exercise of program.exercises) {
        if ("bar" in (exercise as any).exerciseType) {
          exercise.exerciseType.equipment = (exercise as any).exerciseType.bar;
          delete (exercise as any).exerciseType.bar;
        }
      }
    }
    return storage;
  },
  "20210125164435_add_temp_user_id": async (client: Window["fetch"], aStorage: IStorage): Promise<IStorage> => {
    const storage: IStorage = JSON.parse(JSON.stringify(aStorage));
    (storage as any).tempUserId = storage.tempUserId || UidFactory.generateUid(10);
    return storage;
  },
  "20210130224533_add_settings_graphs": async (client: Window["fetch"], aStorage: IStorage): Promise<IStorage> => {
    const storage: IStorage = JSON.parse(JSON.stringify(aStorage));
    const historyExercises = ObjectUtils.keys(History.findAllMaxSetsPerId(storage.history));
    const exerciseIds: IExerciseId[] = ["squat", "benchPress", "overheadPress", "deadlift"];
    const graphs: IExerciseId[] = [];
    for (const exerciseId of exerciseIds) {
      if (historyExercises.indexOf(exerciseId) !== -1) {
        graphs.push(exerciseId);
      }
    }
    (storage as any).settings.graphs = storage.settings.graphs || graphs;
    return storage;
  },
  "20210222215108_add_stats": async (client: Window["fetch"], aStorage: IStorage): Promise<IStorage> => {
    const storage: IStorage = JSON.parse(JSON.stringify(aStorage));
    storage.settings.statsEnabled = storage.settings.statsEnabled || {
      weight: {
        weight: true,
      },
      length: {
        chest: true,
        shoulders: true,
        bicepLeft: true,
        bicepRight: true,
        waist: true,
        thighLeft: true,
        thighRight: true,
      },
    };
    storage.settings.lengthUnits = storage.settings.lengthUnits || "in";
    storage.settings.graphs = storage.settings.graphs.map((g: any) =>
      typeof g === "string" ? { type: "exercise", id: g } : g
    );
    (storage as any).stats = storage.stats || { weight: {}, length: {} };
    return storage;
  },
  "20210626192422_add_settings_exercises": async (client: Window["fetch"], aStorage: IStorage): Promise<IStorage> => {
    const storage: IStorage = JSON.parse(JSON.stringify(aStorage));
    storage.settings.exercises = storage.settings.exercises || {};
    return storage;
  },
  "20210724165526_add_settings_show_friends_history": async (
    client: Window["fetch"],
    aStorage: IStorage
  ): Promise<IStorage> => {
    const storage: IStorage = JSON.parse(JSON.stringify(aStorage));
    storage.settings.shouldShowFriendsHistory =
      storage.settings.shouldShowFriendsHistory == null ? true : storage.settings.shouldShowFriendsHistory;
    return storage;
  },
  "20220807182403_migrate_plates_to_new_format": async (
    client: Window["fetch"],
    aStorage: IStorage
  ): Promise<IStorage> => {
    const anyStorage: any = JSON.parse(JSON.stringify(aStorage));
    const storage: IStorage = JSON.parse(JSON.stringify(aStorage));
    storage.settings.equipment = {
      barbell: {
        multiplier: 2,
        bar: {
          lb: anyStorage.settings.bars?.lb?.barbell || Weight.build(45, "lb"),
          kg: anyStorage.settings.bars?.kg?.barbell || Weight.build(20, "kg"),
        },
        plates: anyStorage.settings.plates,
        fixed: [],
        isFixed: false,
      },
      trapbar: {
        multiplier: 2,
        bar: {
          lb: anyStorage.settings.bars?.lb?.barbell || Weight.build(45, "lb"),
          kg: anyStorage.settings.bars?.kg?.barbell || Weight.build(20, "kg"),
        },
        plates: anyStorage.settings.plates,
        fixed: [],
        isFixed: false,
      },
      smith: {
        multiplier: 2,
        bar: {
          lb: anyStorage.settings.bars?.lb?.barbell || Weight.build(45, "lb"),
          kg: anyStorage.settings.bars?.kg?.barbell || Weight.build(20, "kg"),
        },
        plates: anyStorage.settings.plates,
        fixed: [],
        isFixed: false,
      },
      dumbbell: {
        multiplier: 2,
        bar: {
          lb: anyStorage.settings.bars?.lb?.dumbbell || Weight.build(10, "lb"),
          kg: anyStorage.settings.bars?.kg?.dumbbell || Weight.build(5, "kg"),
        },
        plates: anyStorage.settings.plates,
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
          lb: anyStorage.settings.bars?.lb?.ezbar || Weight.build(20, "lb"),
          kg: anyStorage.settings.bars?.kg?.ezbar || Weight.build(10, "kg"),
        },
        plates: anyStorage.settings.plates,
        fixed: [],
        isFixed: false,
      },
      cable: {
        multiplier: 1,
        bar: {
          lb: Weight.build(0, "lb"),
          kg: Weight.build(0, "kg"),
        },
        plates: [{ weight: Weight.build(10, "lb"), num: 20 }],
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
    };
    delete (storage.settings as any).bars;
    delete (storage.settings as any).plates;

    return storage;
  },
  "20221116230818_add_graph_settings": async (client: Window["fetch"], aStorage: IStorage): Promise<IStorage> => {
    const storage: IStorage = JSON.parse(JSON.stringify(aStorage));
    storage.settings.graphsSettings = storage.settings.graphsSettings || {
      isSameXAxis: false,
      isWithBodyweight: false,
      isWithOneRm: true,
    };
    return storage;
  },
  "20230107181335_add_subscriptions": async (client: Window["fetch"], aStorage: IStorage): Promise<IStorage> => {
    const storage: IStorage = JSON.parse(JSON.stringify(aStorage));
    storage.subscription = storage.subscription || { apple: {}, google: {} };
    return storage;
  },
  "20230111092752_add_graph_program_lines": async (client: Window["fetch"], aStorage: IStorage): Promise<IStorage> => {
    const storage: IStorage = JSON.parse(JSON.stringify(aStorage));
    if (storage.settings.graphsSettings.isWithProgramLines == null) {
      storage.settings.graphsSettings.isWithProgramLines = true;
    }
    return storage;
  },
  "20230121135616_add_exercise_stats_settings": async (
    client: Window["fetch"],
    aStorage: IStorage
  ): Promise<IStorage> => {
    const storage: IStorage = JSON.parse(JSON.stringify(aStorage));
    storage.settings.exerciseStatsSettings = storage.settings.exerciseStatsSettings || {
      ascendingSort: false,
    };
    return storage;
  },
  "20230226222150_add_review_requests": async (client: Window["fetch"], aStorage: IStorage): Promise<IStorage> => {
    const storage: IStorage = JSON.parse(JSON.stringify(aStorage));
    storage.reviewRequests = storage.reviewRequests || [];
    return storage;
  },
  "20230303212519_add_affiliates": async (client: Window["fetch"], aStorage: IStorage): Promise<IStorage> => {
    const storage: IStorage = JSON.parse(JSON.stringify(aStorage));
    storage.affiliates = storage.affiliates || {};
    return storage;
  },
  "20230306235731_add_signup_requests": async (client: Window["fetch"], aStorage: IStorage): Promise<IStorage> => {
    const storage: IStorage = JSON.parse(JSON.stringify(aStorage));
    storage.signupRequests = storage.signupRequests || [];
    return storage;
  },
  "20230611102656_add_missing_leverage_machine": async (
    client: Window["fetch"],
    aStorage: IStorage
  ): Promise<IStorage> => {
    const storage: IStorage = JSON.parse(JSON.stringify(aStorage));
    storage.settings.equipment.leverageMachine = storage.settings.equipment.leverageMachine || {
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
    };
    return storage;
  },
  "20230612190339_add_volume_to_settings": async (client: Window["fetch"], aStorage: IStorage): Promise<IStorage> => {
    const storage: IStorage = JSON.parse(JSON.stringify(aStorage));
    storage.settings.volume = storage.settings.volume == null ? 1 : storage.settings.volume;
    return storage;
  },
  "20230613211015_migrate_to_descriptions": async (client: Window["fetch"], aStorage: IStorage): Promise<IStorage> => {
    const storage: IStorage = JSON.parse(JSON.stringify(aStorage));
    for (const program of storage.programs) {
      for (const exercise of program.exercises) {
        if (exercise.description) {
          exercise.descriptions = exercise.descriptions || [exercise.description];
        } else {
          exercise.descriptions = exercise.descriptions || [""];
        }
      }
    }
    return storage;
  },
  "20230623155732_add_bodyfat_percentage": async (client: Window["fetch"], aStorage: IStorage): Promise<IStorage> => {
    const storage: IStorage = JSON.parse(JSON.stringify(aStorage));
    storage.settings.statsEnabled.percentage = storage.settings.statsEnabled.percentage || { bodyfat: false };
    storage.stats.percentage = storage.stats.percentage || {};
    return storage;
  },
  "20230709112106_fix_empty_program_ids": async (client: Window["fetch"], aStorage: IStorage): Promise<IStorage> => {
    const storage: IStorage = JSON.parse(JSON.stringify(aStorage));
    for (const program of storage.programs) {
      if (program.id === "") {
        program.id = UidFactory.generateUid(8);
      }
    }
    if (storage.programs.length > 0 && storage.currentProgramId === "") {
      storage.currentProgramId = storage.programs[0].id;
    }
    return storage;
  },
  "20230826135508_add_multiweek_support": async (client: Window["fetch"], aStorage: IStorage): Promise<IStorage> => {
    const storage: IStorage = JSON.parse(JSON.stringify(aStorage));
    for (const program of storage.programs) {
      program.isMultiweek = program.isMultiweek ?? false;
      program.weeks = program.weeks ?? [];
      for (const day of program.days) {
        day.id = day.id || UidFactory.generateUid(8);
      }
    }
    return storage;
  },
  "20230922191948_add_graph_options": async (client: Window["fetch"], aStorage: IStorage): Promise<IStorage> => {
    const storage: IStorage = JSON.parse(JSON.stringify(aStorage));
    storage.settings.graphOptions = storage.settings.graphOptions || {};
    return storage;
  },
  "20231006165141_fix_null_nextday": async (client: Window["fetch"], aStorage: IStorage): Promise<IStorage> => {
    const storage: IStorage = JSON.parse(JSON.stringify(aStorage));
    for (const program of storage.programs) {
      program.nextDay = program.nextDay ?? 1;
    }
    return storage;
  },
  "20231009191950_clear_caches": async (client: Window["fetch"], aStorage: IStorage): Promise<IStorage> => {
    if (typeof window !== "undefined") {
      SendMessage.toIos({ type: "clearCache" });
      SendMessage.toAndroid({ type: "clearCache" });
    }
    return aStorage;
  },
  "20231126225248_deleted_items": async (client: Window["fetch"], aStorage: IStorage): Promise<IStorage> => {
    const storage: IStorage = JSON.parse(JSON.stringify(aStorage));
    storage.deletedHistory = storage.deletedHistory || [];
    storage.deletedPrograms = storage.deletedPrograms || [];
    storage.deletedStats = storage.deletedStats || [];
    return storage;
  },
  "20231127190359_add_cloned_at_to_programs": async (
    client: Window["fetch"],
    aStorage: IStorage
  ): Promise<IStorage> => {
    const storage: IStorage = JSON.parse(JSON.stringify(aStorage));
    for (const program of storage.programs) {
      program.clonedAt = program.clonedAt ?? Date.now() - Math.floor(Math.random() * 1000);
    }
    return storage;
  },
  "20231203114534_fix_duplicated_ids_in_weeks": async (
    client: Window["fetch"],
    aStorage: IStorage
  ): Promise<IStorage> => {
    const storage: IStorage = JSON.parse(JSON.stringify(aStorage));
    for (const program of storage.programs) {
      const groupByIdWeeks = CollectionUtils.groupByKey(program.weeks, "id");
      const hasDuplicatedIds = ObjectUtils.values(groupByIdWeeks).some((v) => (v?.length || 0) > 1);
      if (hasDuplicatedIds) {
        for (const week of program.weeks) {
          week.id = UidFactory.generateUid(8);
        }
      }
    }
    return storage;
  },
  "20231207095636_fix_duplicated_ids_in_weeks_2": async (
    client: Window["fetch"],
    aStorage: IStorage
  ): Promise<IStorage> => {
    const storage: IStorage = JSON.parse(JSON.stringify(aStorage));
    for (const program of storage.programs) {
      const groupByIdWeeks = CollectionUtils.groupByKey(program.weeks, "id");
      const hasDuplicatedIds = ObjectUtils.values(groupByIdWeeks).some((v) => (v?.length || 0) > 1);
      if (hasDuplicatedIds) {
        for (const week of program.weeks) {
          week.id = UidFactory.generateUid(8);
        }
      }
    }
    return storage;
  },
  "20231216161503_fix_broken_storage_for_yrurftmdmt": async (
    client: Window["fetch"],
    aStorage: IStorage
  ): Promise<IStorage> => {
    const storage: IStorage = JSON.parse(JSON.stringify(aStorage));
    if (storage.tempUserId === "yrurftmdmt") {
      try {
        (storage as any).history[0].userPromptedStateVars.fpbazbvg.rir = 0;
        (storage as any).programs[0].exercises[1].reuseLogic.states.iksjdlyj.rir = 0;
      } catch (e) {
        // noop
      }
      return storage;
    } else {
      return aStorage;
    }
  },
  "20240106145047_split_graphs_by_equipment": async (
    client: Window["fetch"],
    aStorage: IStorage
  ): Promise<IStorage> => {
    const storage: IStorage = JSON.parse(JSON.stringify(aStorage));
    let equipmentMap: Record<string, Record<string, number>> | undefined = undefined;
    for (const graph of storage.settings.graphs) {
      if (graph.type === "exercise") {
        const exerciseId = graph.id;
        if (exerciseId.indexOf("_") !== -1) {
          continue;
        }
        equipmentMap =
          equipmentMap ||
          storage.history.reduce<Record<string, Record<string, number>>>((memo, hr) => {
            for (const entry of hr.entries) {
              const id = entry.exercise.id;
              const equipment = entry.exercise.equipment || "bodyweight";
              memo[id] = memo[id] || {};
              memo[id]![equipment] = memo[id][equipment] || 0;
              memo[id]![equipment] += 1;
            }
            return memo;
          }, {});
        const usage = equipmentMap[graph.id];
        if (usage == null) {
          continue;
        }
        const popularEquipment = CollectionUtils.sortByExpr(ObjectUtils.entries(usage), (i) => i[1], true)[0]?.[0];
        graph.id = `${graph.id}_${popularEquipment}`;
      }
    }
    return storage;
  },
  "20240106161121_add_exercise_data": async (client: Window["fetch"], aStorage: IStorage): Promise<IStorage> => {
    const storage: IStorage = JSON.parse(JSON.stringify(aStorage));
    storage.settings.exerciseData = storage.settings.exerciseData || {};
    return storage;
  },
  "20240123071752_add_planner": async (client: Window["fetch"], aStorage: IStorage): Promise<IStorage> => {
    const storage: IStorage = JSON.parse(JSON.stringify(aStorage));
    storage.settings.planner = storage.settings.planner || Settings.buildPlannerSettings();
    return storage;
  },
};
