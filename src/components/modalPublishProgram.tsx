import * as React from "react";
import { Button } from "./button";
import { Modal } from "./modal";
import { IDispatch } from "../ducks/types";
import { inputClassName } from "./input";
import { useRef } from "react";
import { Thunk } from "../ducks/thunks";
import { IProgram } from "../types";

interface IProps {
  program: IProgram;
  dispatch: IDispatch;
  onClose: () => void;
}

export function ModalPublishProgram(props: IProps): JSX.Element {
  const { program, dispatch } = props;
  const idRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const urlRef = useRef<HTMLInputElement>(null);
  const authorRef = useRef<HTMLInputElement>(null);
  return (
    <Modal shouldShowClose={true} onClose={props.onClose}>
      <form>
        <div>
          <label htmlFor="program_id">Id</label>
          <input ref={idRef} id="program_id" className={inputClassName} type="text" value={program.id} />
        </div>
        <div>
          <label htmlFor="program_name">Name</label>
          <input ref={nameRef} id="program_name" className={inputClassName} type="text" value={program.name} />
        </div>
        <div>
          <label htmlFor="program_description">Description</label>
          <textarea ref={descriptionRef} id="program_description" className={inputClassName}>
            {program.description}
          </textarea>
        </div>
        <div>
          <label htmlFor="program_url">Url</label>
          <input ref={urlRef} id="program_url" className={inputClassName} type="text" value={program.url} />
        </div>
        <div>
          <label htmlFor="program_author">Author</label>
          <input ref={authorRef} id="program_author" className={inputClassName} type="text" value={program.author} />
        </div>
        <div className="mt-4 text-center">
          <Button
            type="button"
            kind="green"
            className="mr-3"
            onClick={() => {
              props.onClose();
              dispatch(
                Thunk.publishProgram({
                  id: idRef.current!.value,
                  name: nameRef.current!.value,
                  description: descriptionRef.current!.value,
                  url: urlRef.current!.value,
                  author: authorRef.current!.value,
                })
              );
            }}
          >
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
}
