import { h, JSX, Fragment } from "preact";
import "../../models/state";
import { Exercise } from "../../models/exercise";
import { History } from "../../models/history";
import { ObjectUtils } from "../../utils/object";
import { Weight } from "../../models/weight";
import { GraphExercise } from "../../components/graphExercise";
import { Program } from "../../models/program";
import { IStorage, IExerciseId, IHistoryRecord, ISet, ISettings } from "../../types";

interface IProps {
  data: IStorage;
}

export function UserContent(props: IProps): JSX.Element {
  const { history, settings } = props.data;
  const maxSets = History.findAllMaxSets(props.data.history);
  const order: IExerciseId[] = ["benchPress", "overheadPress", "squat", "deadlift"];
  const hasMainLifts = ObjectUtils.keys(maxSets).some((k) => order.indexOf(k) !== -1);

  const currentProgram = Program.getCurrentProgram(props.data);

  return (
    <section className="px-6">
      <h1 className="mb-6">
        {settings.nickname ? (
          <Fragment>
            <div className="text-sm text-gray-500 uppercase">User Profile</div>
            <div className="text-3xl font-bold">{settings.nickname}</div>
          </Fragment>
        ) : (
          <span className="text-3xl font-bold">User Profile</span>
        )}
      </h1>
      {currentProgram && (
        <p>
          <span className="text-gray-600">Current program: </span>
          <span className="font-bold">{currentProgram.name}</span>
        </p>
      )}
      {hasMainLifts && (
        <div className="mb-16">
          <h2 className="my-4 text-xl font-bold">Main Lifts Progress</h2>
          {order.map((id) =>
            maxSets[id] != null ? (
              <Entry exerciseId={id} maxSet={maxSets[id]!} history={history} settings={settings} />
            ) : undefined
          )}
        </div>
      )}
      <Fragment>
        <h2 className="my-4 text-xl font-bold">{hasMainLifts ? "Rest Lifts Progress" : "Lifts Progress"}</h2>
        {ObjectUtils.keys(maxSets).map((id) =>
          order.indexOf(id) === -1 ? (
            <Entry exerciseId={id} maxSet={maxSets[id]!} history={history} settings={settings} />
          ) : undefined
        )}
      </Fragment>
    </section>
  );
}

interface IEntryProps {
  history: IHistoryRecord[];
  exerciseId: IExerciseId;
  maxSet: ISet;
  settings: ISettings;
}

function Entry(props: IEntryProps): JSX.Element {
  const { history, maxSet, settings } = props;
  const exercise = Exercise.getById(props.exerciseId);

  return (
    <section className="p-4 my-2 bg-gray-100 border border-gray-600 rounded-lg">
      <h4 className="text-lg font-bold">{exercise.name}</h4>
      <div>
        <p>
          <span dangerouslySetInnerHTML={{ __html: "&#x1F3CB Max lifted reps x weight: " }} />
          <strong>
            {maxSet.completedReps} x {Weight.display(maxSet.weight)}
          </strong>
        </p>
      </div>
      <div className="record-graph">
        <GraphExercise title="Progress Graph" history={history} exercise={exercise} settings={settings} />
      </div>
    </section>
  );
}
