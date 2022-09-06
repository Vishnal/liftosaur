import * as React from "react";
import { IDispatch } from "../../ducks/types";
import { HeaderView } from "../header";
import { FooterView } from "../footer";
import { MenuItemEditable } from "../menuItemEditable";
import { EditProgram } from "../../models/editProgram";
import { DraggableList } from "../draggableList";
import { GroupHeader } from "../groupHeader";
import { MenuItem } from "../menuItem";
import { IconCheck } from "../iconCheck";
import { IconDelete } from "../iconDelete";
import { IconEdit } from "../iconEdit";
import { SemiButton } from "../semiButton";
import { IconMuscles } from "../iconMuscles";
import { Thunk } from "../../ducks/thunks";
import { ISettings, IProgram, IProgramDay } from "../../types";
import { ILoading } from "../../models/state";

interface IProps {
  isProgress: boolean;
  dayIndex: number;
  settings: ISettings;
  editProgram: IProgram;
  editDay: IProgramDay;
  loading: ILoading;
  dispatch: IDispatch;
}

export interface IEditSet {
  exerciseIndex: number;
  setIndex?: number;
}

export function EditProgramDay(props: IProps): JSX.Element {
  const program = props.editProgram;
  const day = props.editDay;
  const { dayIndex } = props;

  return (
    <section className="h-full">
      <HeaderView
        title={day.name}
        subtitle="Edit Program Day"
        left={<button onClick={() => props.dispatch({ type: "PullScreen" })}>Back</button>}
      />
      <section style={{ paddingTop: "3.5rem", paddingBottom: "4rem" }}>
        <section className="flex-1 overflow-y-auto">
          <MenuItemEditable
            type="text"
            name="Name:"
            value={day.name}
            onChange={(newValue) => {
              if (newValue != null) {
                EditProgram.setDayName(props.dispatch, program, dayIndex, newValue);
              }
            }}
          />
          <section data-cy="selected-exercises">
            <GroupHeader name="Selected exercises" />
            <DraggableList
              items={day.exercises}
              element={(exerciseRef, i, handleTouchStart) => {
                const exercise = program.exercises.find((e) => e.id === exerciseRef.id)!;
                return (
                  <MenuItem
                    handleTouchStart={handleTouchStart}
                    name={exercise.name}
                    value={
                      <>
                        <button
                          className="p-2 align-middle ls-day-edit-exercise button"
                          onClick={() => EditProgram.editProgramExercise(props.dispatch, exercise)}
                        >
                          <IconEdit size={20} lineColor="#0D2B3E" penColor="#A5B3BB" />
                        </button>
                        <button
                          className="p-2 align-middle ls-day-toggle-exercise button"
                          onClick={() =>
                            EditProgram.toggleDayExercise(props.dispatch, program, props.dayIndex, exercise.id)
                          }
                        >
                          <IconDelete />
                        </button>
                      </>
                    }
                  />
                );
              }}
              onDragEnd={(startIndex, endIndex) => {
                EditProgram.reorderExercises(props.dispatch, program, dayIndex, startIndex, endIndex);
              }}
            />
            <div className="p-1">
              <SemiButton
                className="ls-day-add-exercise"
                onClick={() => {
                  EditProgram.addProgramExercise(props.dispatch);
                }}
              >
                Create New Exercise
              </SemiButton>
            </div>
          </section>
          <section data-cy="available-exercises">
            <GroupHeader name="Available exercises" />
            {program.exercises.map((exercise) => (
              <MenuItem
                key={exercise.id}
                name={exercise.name}
                onClick={() => {
                  EditProgram.toggleDayExercise(props.dispatch, program, props.dayIndex, exercise.id);
                }}
                value={
                  day.exercises.some((e) => e.id === exercise.id) ? (
                    <div className="flex flex-row-reverse">
                      <IconCheck />
                    </div>
                  ) : undefined
                }
              />
            ))}
          </section>
        </section>
      </section>

      <FooterView
        loading={props.loading}
        buttons={
          <button
            data-cy="footer-muscles"
            className="p-4 ls-footer-muscles"
            aria-label="Muscles"
            onClick={() => props.dispatch(Thunk.pushScreen("musclesDay"))}
          >
            <IconMuscles />
          </button>
        }
        dispatch={props.dispatch}
      />
    </section>
  );
}
