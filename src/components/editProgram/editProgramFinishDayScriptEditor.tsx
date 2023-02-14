import { h, JSX, Fragment } from "preact";
import { InternalLink } from "../../internalLink";
import { IProgramExercise } from "../../types";
import { IEither } from "../../utils/types";
import { GroupHeader } from "../groupHeader";
import { MultiLineTextEditor } from "./multiLineTextEditor";

export interface IEditProgramFinishDayScriptEditorProps {
  programExercise: IProgramExercise;
  editorResult: IEither<number | undefined, string>;
  onSetFinishDayExpr: (value: string) => void;
}

export function EditProgramFinishDayScriptEditor(props: IEditProgramFinishDayScriptEditorProps): JSX.Element {
  const { programExercise } = props;

  return (
    <Fragment>
      <GroupHeader
        topPadding={true}
        name="Finish Day Script"
        help={
          <span>
            Liftoscript script, that's run after finishing a day. You should update <strong>State Variables</strong>{" "}
            here. You also have access to weights, completed reps, etc from the workout. Refer to the{" "}
            <InternalLink href="/docs/docs.html" className="text-blue-700 underline">
              documentation
            </InternalLink>{" "}
            to learn how to write the scripts.
          </span>
        }
      />
      <MultiLineTextEditor
        name="finish-day"
        state={programExercise.state}
        result={props.editorResult}
        value={programExercise.finishDayExpr}
        onChange={(value) => {
          props.onSetFinishDayExpr(value);
        }}
      />
    </Fragment>
  );
}
