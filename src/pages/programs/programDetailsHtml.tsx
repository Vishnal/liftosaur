import * as React from "react";
import { Page } from "../../components/page";
import { MockAudioInterface } from "../../lib/audioInterface";
import { IProgram } from "../../types";
import { ProgramDetailsContent } from "./programDetailsContent";

interface IProps {
  selectedProgramId: string;
  programs: IProgram[];
  client: Window["fetch"];
}

export function ProgramDetailsHtml(props: IProps): JSX.Element {
  const { programs, selectedProgramId } = props;
  const program = programs.filter((p) => p.id === selectedProgramId)[0] || programs[0];
  const audio = new MockAudioInterface();
  const { client, ...data } = props;

  return (
    <Page
      css={["programdetails"]}
      js={["programdetails"]}
      title={`Liftosaur: Program Details - ${program.name}`}
      ogTitle={`Liftosaur: Program Details - ${program.name}`}
      ogDescription={`What days and exercises the program '${program.name}' consists of`}
      ogUrl={`https://www.liftosaur.com/programs/${program.id}`}
      ogImage={`https://www.liftosaur.com/programimage/${program.id}`}
      data={data}
      postHead={
        <link href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.21.0/themes/prism.min.css" rel="stylesheet" />
      }
    >
      <ProgramDetailsContent
        programs={props.programs}
        selectedProgramId={props.selectedProgramId}
        client={props.client}
        audio={audio}
      />
    </Page>
  );
}
