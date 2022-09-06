import * as React from "react";
import { useRef } from "react";
import { Button } from "./button";
import { IDispatch } from "../ducks/types";
import { Modal } from "./modal";
import { DateUtils } from "../utils/date";

interface IModalDateProps {
  dispatch: IDispatch;
  date: string;
  isHidden: boolean;
}

export function ModalDate(props: IModalDateProps): JSX.Element {
  const textInput = useRef<HTMLInputElement>(null);
  const date = new Date(Date.parse(props.date));
  const formattedDate = DateUtils.formatYYYYMMDD(date);
  return (
    <Modal isHidden={props.isHidden} autofocusInputRef={textInput}>
      <h3 className="pb-2 font-bold">Please enter new date</h3>
      <form onSubmit={(e) => e.preventDefault()}>
        <input
          ref={textInput}
          className="focus:outline-none focus:shadow-outline block w-full px-4 py-2 leading-normal bg-white border border-gray-300 rounded-lg appearance-none"
          type="date"
          placeholder="Date"
          value={formattedDate}
        />
        <div className="mt-4 text-right">
          <Button
            type="button"
            kind="gray"
            className="mr-3"
            onClick={() => {
              props.dispatch({ type: "ConfirmDate", date: undefined });
            }}
          >
            Cancel
          </Button>
          <Button
            kind="green"
            type="submit"
            className="ls-modal-set-date"
            onClick={() => {
              const value = textInput.current?.value;
              props.dispatch({ type: "ConfirmDate", date: value });
            }}
          >
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
}
