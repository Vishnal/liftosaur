import { lb } from "lens-shmens";
import { h, JSX } from "preact";
import { Exercise } from "../../models/exercise";
import { useLensReducer } from "../../utils/useLensReducer";
import { BuilderModalExercise } from "./components/builderModalExercise";
import { BuilderWeek } from "./components/builderWeek";
import { IBuilderState } from "./models/builderReducer";
import { BuilderLinkInlineInput } from "./components/builderInlineInput";
import { BuilderWeekModel } from "./models/builderWeekModel";
import { LinkButton } from "../../components/linkButton";
import { StringUtils } from "../../utils/string";
import { ModalSubstitute } from "../../components/modalSubstitute";
import { ModalExercisesByMuscle } from "../../components/modalExercisesByMuscle";
import { Encoder } from "../../utils/encoder";
import { IBuilderProgram } from "./models/types";
import { BuilderExerciseModel } from "./models/builderExerciseModel";
import { ObjectUtils } from "../../utils/object";
import { useCopyPaste } from "./utils/copypaste";
import { undoRedoMiddleware, useUndoRedo } from "./utils/undoredo";
import { BuilderCopyLink } from "./components/builderCopyLink";
import { BuilderModalSettings } from "./components/builderModalSettings";
import { IconCog2 } from "../../components/icons/iconCog2";
import { useState } from "preact/hooks";
import { IconHelp } from "../../components/icons/iconHelp";
import { BuilderHelpOverlay } from "./components/builderHelpOverlay";

export interface IBuilderContentProps {
  client: Window["fetch"];
  program?: IBuilderProgram;
}

export function BuilderContent(props: IBuilderContentProps): JSX.Element {
  const initialState: IBuilderState = {
    program: props.program || {
      name: "My Program",
      weeks: [BuilderWeekModel.build("Week 1")],
    },
    settings: {
      unit: "lb",
    },
    history: {
      past: [],
      future: [],
    },
    ui: {},
  };
  const [state, dispatch] = useLensReducer(initialState, { client: props.client }, [
    async (action, oldState, newState) => {
      if (oldState.program !== newState.program) {
        await Encoder.encodeIntoUrl(JSON.stringify(newState.program));
      }
    },
    async (action, oldState, newState) => {
      if (
        !("type" in action && action.type === "Update" && action.desc === "undo") &&
        oldState.program !== newState.program
      ) {
        undoRedoMiddleware(dispatch, oldState);
      }
    },
    async (action, oldState, newState) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).state = newState;
    },
  ]);

  useCopyPaste(state, dispatch);
  useUndoRedo(state, dispatch);
  const [showOnboarding, setShowOnboarding] = useState<number>(0);

  const modalExerciseUi = state.ui.modalExercise;
  const modalSubstituteUi = state.ui.modalSubstitute;
  const modalExercisesByMuscle = state.ui.modalExercisesByMuscle;
  const modalSettings = state.ui.modalSettings;

  return (
    <section className="py-16">
      <div className="flex items-center">
        <h1 className="flex-1 text-2xl font-bold">
          <a className="font-bold underline text-bluev2 " href="/builder">
            Weightlifting Program Builder
          </a>
        </h1>
        <div>
          <BuilderCopyLink />
          <button
            className="p-2 align-middle"
            onClick={() => dispatch([lb<IBuilderState>().p("ui").p("modalSettings").record(true)])}
          >
            <IconCog2 />
          </button>
          <button
            className="p-2 align-middle"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.localStorage.setItem("liftosaur-builder-help-displayed", "0");
              }
              setShowOnboarding(showOnboarding + 1);
            }}
          >
            <IconHelp />
          </button>
        </div>
      </div>
      <p className="pb-2">
        This is a tool to build your weightlifting programs. It allows to make sure you have enough volume for each
        muscle group, and balance it with the time you spent in the gym.
      </p>
      <h2 className="pb-3 mt-8 text-xl font-bold">
        <BuilderLinkInlineInput
          value={state.program.name}
          onInputString={(value) => {
            dispatch([lb<IBuilderState>().p("program").p("name").record(value)]);
          }}
        />
      </h2>
      {state.program.weeks.map((week, index) => (
        <BuilderWeek
          numberOfWeeks={state.program.weeks.length}
          selectedExercise={state.ui.selectedExercise}
          week={week}
          index={index}
          settings={state.settings}
          dispatch={dispatch}
        />
      ))}
      <LinkButton
        onClick={() => {
          const lastWeek = state.program.weeks[state.program.weeks.length - 1];
          const week = BuilderWeekModel.build(StringUtils.nextName(lastWeek.name));
          dispatch([
            lb<IBuilderState>()
              .p("program")
              .p("weeks")
              .recordModify((weeks) => [...weeks, week]),
          ]);
        }}
      >
        Add Week
      </LinkButton>
      <BuilderModalExercise
        isHidden={!modalExerciseUi}
        dispatch={dispatch}
        onChange={(exerciseId) => {
          if (exerciseId && modalExerciseUi) {
            const exercise = Exercise.getById(exerciseId, {});
            dispatch([
              lb<IBuilderState>()
                .p("program")
                .p("weeks")
                .i(modalExerciseUi.weekIndex)
                .p("days")
                .i(modalExerciseUi.dayIndex)
                .p("exercises")
                .i(modalExerciseUi.exerciseIndex)
                .p("exerciseType")
                .record({ id: exercise.id, equipment: exercise.equipment }),
            ]);
          }
          dispatch([lb<IBuilderState>().p("ui").p("modalExercise").record(undefined)]);
        }}
      />
      {modalSubstituteUi && (
        <ModalSubstitute
          exerciseType={modalSubstituteUi.exerciseType}
          customExercises={{}}
          onChange={(exerciseId) => {
            if (exerciseId) {
              const exercise = Exercise.getById(exerciseId, {});
              dispatch([
                lb<IBuilderState>()
                  .p("program")
                  .p("weeks")
                  .i(modalSubstituteUi.weekIndex)
                  .p("days")
                  .i(modalSubstituteUi.dayIndex)
                  .p("exercises")
                  .i(modalSubstituteUi.exerciseIndex)
                  .p("exerciseType")
                  .record({ id: exercise.id, equipment: exercise.equipment }),
              ]);
            }
            dispatch([lb<IBuilderState>().p("ui").p("modalSubstitute").record(undefined)]);
          }}
        />
      )}
      {modalExercisesByMuscle && (
        <ModalExercisesByMuscle
          screenMuscle={modalExercisesByMuscle.muscle}
          customExercises={{}}
          onChange={(exerciseId) => {
            if (exerciseId) {
              const exercise = Exercise.getById(exerciseId, {});
              const exType = ObjectUtils.pick(exercise, ["id", "equipment"]);
              const week = state.program.weeks[modalExercisesByMuscle.weekIndex];
              dispatch([
                lb<IBuilderState>()
                  .p("program")
                  .p("weeks")
                  .i(modalExercisesByMuscle.weekIndex)
                  .p("days")
                  .i(week.days.length - 1)
                  .p("exercises")
                  .recordModify((exercises) => [...exercises, BuilderExerciseModel.build(exType)]),
              ]);
            }
            dispatch([lb<IBuilderState>().p("ui").p("modalExercisesByMuscle").record(undefined)]);
          }}
        />
      )}
      {modalSettings && <BuilderModalSettings dispatch={dispatch} unit={state.settings.unit} />}
      <BuilderHelpOverlay key={showOnboarding} />
    </section>
  );
}
