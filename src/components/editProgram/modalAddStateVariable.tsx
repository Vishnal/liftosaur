import * as React from "react";
import { Modal } from "../modal";
import { Button } from "../button";
import { useRef } from "react";

interface IProps {
  onDone: (newValue?: string, newType?: string) => void;
  isHidden: boolean;
}

export function ModalAddStateVariable(props: IProps): JSX.Element {
  const textInput = useRef<HTMLInputElement>(null);
  const typeInput = useRef<HTMLSelectElement>(null);
  return (
    <Modal isHidden={props.isHidden} autofocusInputRef={textInput}>
      <h3 className="pb-2 font-bold text-center">Add State Variable</h3>
      <form onSubmit={(e) => e.preventDefault()}>
        <label htmlFor="add_state_variable" className="block text-sm font-bold">
          Variable Name
        </label>
        <input
          data-cy="modal-add-state-variable-input-name"
          id="add_state_variable"
          ref={textInput}
          className="block w-full px-4 py-2 leading-normal bg-white border border-gray-300 rounded-lg appearance-none focus:outline-none focus:shadow-outline"
          value=""
          type="text"
          autoFocus
        />
        <div className="flex my-4">
          <label htmlFor="add_state_variable_type" className="text-sm font-bold">
            Variable Type:
          </label>
          <select
            data-cy="modal-add-state-variable-input-type"
            ref={typeInput}
            id="add_state_variable_type"
            className="flex-1 ml-4 text-gray-700"
          >
            {[
              ["", "number"],
              ["kg", "kg"],
              ["lb", "lb"],
            ].map(([key, value]) => (
              <option value={key}>{value}</option>
            ))}
          </select>
        </div>
        <div className="mt-4 text-right">
          <Button
            data-cy="modal-add-state-variable-cancel"
            type="button"
            kind="gray"
            className="mr-3"
            onClick={() => props.onDone()}
          >
            Cancel
          </Button>
          <Button
            data-cy="modal-add-state-variable-submit"
            kind="green"
            type="submit"
            onClick={() => props.onDone(textInput.current!.value, typeInput.current!.value)}
          >
            Add
          </Button>
        </div>
      </form>
    </Modal>
  );
}
