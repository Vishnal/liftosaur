import { lb } from "lens-shmens";
import * as React from "react";
import { Modal } from "../../../components/modal";
import { MusclesView } from "../../../components/muscles/musclesView";
import { IPoints, Muscle } from "../../../models/muscle";
import { IProgram, ISettings } from "../../../types";
import { IProgramDetailsDispatch, IProgramDetailsMuscles, IProgramDetailsState } from "./types";

interface IProps {
  muscles: IProgramDetailsMuscles;
  program: IProgram;
  settings: ISettings;
  dispatch: IProgramDetailsDispatch;
}

export function ProgramDetailsMusclesModal(props: IProps): JSX.Element {
  let points: IPoints;
  let headerTitle: string;
  if (props.muscles.type === "program") {
    points = Muscle.normalizePoints(Muscle.getPointsForProgram(props.program, props.settings));
    headerTitle = "Muscles used in the program";
  } else {
    const day = props.program.days[props.muscles.dayIndex];
    headerTitle = "Muscles used in the day";
    points = Muscle.normalizePoints(Muscle.getPointsForDay(props.program, day, props.settings));
  }

  const headerHelp = (
    <span>
      Shows how much specific muscles used {props.muscles.type === "program" ? "in the program" : "in the current day"}.
      You may use it to find inbalances in your program. We calculate usage for <strong>strength</strong> and{" "}
      <strong>hypertrophy</strong> separately. For <strong>strength</strong> we consider sets with reps &lt; 8, for{" "}
      <strong>hypertrophy</strong> - sets with reps &gt;= 8. For calculating percentages, we assume each target muscle
      is 3x of each synergist muscle, we combine all sets and reps, and then normalize by the most used muscle - it will
      be 100%.
    </span>
  );

  return (
    <Modal
      shouldShowClose={true}
      onClose={() => props.dispatch(lb<IProgramDetailsState>().p("muscles").record(undefined))}
    >
      <div style={{ maxWidth: "400px" }}>
        <MusclesView
          settings={props.settings}
          points={points}
          title={props.program.name}
          headerTitle={headerTitle}
          headerHelp={headerHelp}
        />
      </div>
    </Modal>
  );
}
