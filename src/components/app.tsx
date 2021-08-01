import { h, JSX, Fragment } from "preact";
import { useEffect, useState } from "preact/hooks";
import { reducerWrapper } from "../ducks/reducer";
import { ProgramDayView } from "./programDay";
import { ChooseProgramView } from "./chooseProgram";
import { ProgramHistoryView } from "./programHistory";
import { Program } from "../models/program";
import { Screen } from "../models/screen";
import { ScreenSettings } from "./screenSettings";
import { ScreenAccount } from "./screenAccount";
import { useThunkReducer } from "../utils/useThunkReducer";
import { Thunk } from "../ducks/thunks";
import { Service } from "../api/service";
import { AudioInterface } from "../lib/audioInterface";
import { ScreenTimers } from "./screenTimers";
import { ScreenPlates } from "./screenPlates";
import { ModalOnboarding } from "./modalOnboarding";
import { ScreenGraphs } from "./screenGraphs";
import { ScreenEditProgram } from "./screenEditProgram";
import { Settings } from "../models/settings";
import { HelpOverlay } from "./helpOverlay";
import { Progress } from "../models/progress";
import { dequal } from "dequal";
import { IState } from "../models/state";
import { ScreenFinishDay } from "./screenFinishDay";
import { ScreenMusclesProgram } from "./muscles/screenMusclesProgram";
import { ScreenMusclesDay } from "./muscles/screenMusclesDay";
import { LogUtils } from "../utils/log";
import { ScreenStats } from "./screenStats";
import { ScreenFriends } from "./screenFriends";
import { ScreenFriendsAdd } from "./screenFriendsAdd";
import { Notification } from "./notification";

interface IProps {
  client: Window["fetch"];
  audio: AudioInterface;
  initialState: IState;
}

export function AppView(props: IProps): JSX.Element | null {
  const { client, audio } = props;
  const service = new Service(client);
  const [state, dispatch] = useThunkReducer(reducerWrapper, props.initialState, { service, audio }, [
    (action, oldState, newState) => {
      if (oldState.storage !== newState.storage) {
        dispatch(Thunk.sync());
      }
    },
    (action, oldState, newState) => {
      const progress = newState.progress[0];
      if (progress != null) {
        const oldProgram = Program.getProgram(oldState, progress.programId);
        const newProgram = Program.getProgram(newState, progress.programId);
        if (oldProgram !== newProgram) {
          dispatch({ type: "ApplyProgramChangesToProgress" });
        }
      }
    },
    (action, oldState, newState) => {
      if (oldState.screenStack !== newState.screenStack) {
        setTimeout(() => {
          window.scroll(0, 0);
        }, 0);
      }
    },
  ]);
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false);

  useEffect(() => {
    window._webpushrScriptReady = () => {
      window.webpushr("fetch_id", (sid) => {
        dispatch({ type: "StoreWebpushrSidAction", sid });
      });
    };
    dispatch(Thunk.fetchStorage());
    dispatch(Thunk.fetchPrograms());
    if (state.storage.currentProgramId == null) {
      setShouldShowOnboarding(true);
    }
    window.addEventListener("click", (e) => {
      let button: HTMLButtonElement | undefined;
      let el: HTMLElement | undefined = e.target as HTMLElement;
      while (el != null) {
        if ((el as HTMLElement).tagName?.toLowerCase() === "button") {
          button = el as HTMLButtonElement;
          break;
        }
        el = el.parentNode as HTMLElement | undefined;
      }
      if (button != null) {
        const name = (button.getAttribute("class") || "").split(" ")[0];
        if (name && name.startsWith("ls-")) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const st = (window as any).state as IState;
          LogUtils.log(st.user?.id || st.storage.tempUserId, name);
        }
      }
    });
  }, []);

  const program =
    state.storage.currentProgramId != null ? Program.getProgram(state, state.storage.currentProgramId) : undefined;

  let content: JSX.Element;
  if (
    Screen.current(state.screenStack) === "programs" ||
    (Screen.current(state.screenStack) === "main" && program == null)
  ) {
    content = (
      <Fragment>
        <ChooseProgramView
          loading={state.loading}
          settings={state.storage.settings}
          screenStack={state.screenStack}
          dispatch={dispatch}
          programs={state.programs || []}
          customPrograms={state.storage.programs || []}
          editProgramId={state.progress[0]?.programId}
        />
        {shouldShowOnboarding && <ModalOnboarding onClose={() => setShouldShowOnboarding(false)} />}
      </Fragment>
    );
  } else if (Screen.current(state.screenStack) === "main") {
    if (program != null) {
      content = (
        <ProgramHistoryView
          comments={state.comments}
          loading={state.loading}
          program={program}
          progress={state.progress?.[0]}
          friendsHistory={state.friendsHistory}
          stats={state.storage.stats}
          settings={state.storage.settings}
          history={state.storage.history}
          dispatch={dispatch}
        />
      );
    } else {
      throw new Error("Program is not selected on the 'main' screen");
    }
  } else if (Screen.current(state.screenStack) === "progress") {
    const progress = state.progress[state.currentHistoryRecord!]!;
    if (state.currentHistoryRecordUserId && state.friendsHistory[state.currentHistoryRecordUserId]) {
      const friend = state.friendsHistory[state.currentHistoryRecordUserId]!;
      content = (
        <ProgramDayView
          friends={state.allFriends}
          loading={state.loading}
          comments={state.comments}
          userId={state.user?.id}
          history={[]}
          friend={friend}
          progress={progress}
          isChanged={false}
          program={undefined}
          dispatch={dispatch}
          nickname={state.storage.settings.nickname}
          settings={friend.storage.settings}
        />
      );
    } else {
      const oldHistoryRecord = state.storage.history.find((hr) => hr.id === state.currentHistoryRecord);
      const isChanged = oldHistoryRecord != null && !dequal(oldHistoryRecord, progress);
      content = (
        <ProgramDayView
          friends={state.allFriends}
          nickname={state.storage.settings.nickname}
          loading={state.loading}
          history={state.storage.history}
          userId={state.user?.id}
          progress={progress}
          isChanged={isChanged}
          program={Progress.isCurrent(progress) ? program : undefined}
          comments={state.comments}
          dispatch={dispatch}
          webpushr={state.webpushr}
          timerSince={progress.timerSince}
          timerMode={progress.timerMode}
          settings={state.storage.settings}
        />
      );
    }
  } else if (Screen.current(state.screenStack) === "settings") {
    content = (
      <ScreenSettings
        loading={state.loading}
        dispatch={dispatch}
        user={state.user}
        currentProgramName={Program.getProgram(state, state.storage.currentProgramId)?.name || ""}
        settings={state.storage.settings}
      />
    );
  } else if (Screen.current(state.screenStack) === "friends") {
    content = <ScreenFriends loading={state.loading} allFriends={state.allFriends} dispatch={dispatch} />;
  } else if (Screen.current(state.screenStack) === "friendsAdd") {
    content = <ScreenFriendsAdd loading={state.loading} allFriends={state.allFriends} dispatch={dispatch} />;
  } else if (Screen.current(state.screenStack) === "stats") {
    content = (
      <ScreenStats
        loading={state.loading}
        dispatch={dispatch}
        settings={state.storage.settings}
        stats={state.storage.stats}
      />
    );
  } else if (Screen.current(state.screenStack) === "account") {
    content = <ScreenAccount loading={state.loading} dispatch={dispatch} email={state.user?.email} />;
  } else if (Screen.current(state.screenStack) === "timers") {
    content = <ScreenTimers loading={state.loading} dispatch={dispatch} timers={state.storage.settings.timers} />;
  } else if (Screen.current(state.screenStack) === "plates") {
    content = (
      <ScreenPlates
        loading={state.loading}
        dispatch={dispatch}
        bars={Settings.bars(state.storage.settings)}
        plates={Settings.plates(state.storage.settings)}
        units={state.storage.settings.units}
      />
    );
  } else if (Screen.current(state.screenStack) === "graphs") {
    content = (
      <ScreenGraphs
        loading={state.loading}
        settings={state.storage.settings}
        dispatch={dispatch}
        history={state.storage.history}
        stats={state.storage.stats}
      />
    );
  } else if (Screen.editProgramScreens.indexOf(Screen.current(state.screenStack)) !== -1) {
    let editProgram = Program.getEditingProgram(state);
    editProgram = editProgram || Program.getProgram(state, state.progress[0]?.programId);
    if (editProgram != null) {
      content = (
        <ScreenEditProgram
          loading={state.loading}
          adminKey={state.adminKey}
          settings={state.storage.settings}
          editExercise={state.editExercise}
          screen={Screen.current(state.screenStack)}
          dispatch={dispatch}
          programIndex={Program.getEditingProgramIndex(state)}
          dayIndex={Math.min(state.editProgram?.dayIndex ?? state.progress[0]?.day ?? 0, editProgram.days.length - 1)}
          editProgram={editProgram}
        />
      );
    } else {
      throw new Error("Opened 'editProgram' screen, but 'state.editProgram' is null");
    }
  } else if (Screen.current(state.screenStack) === "finishDay") {
    content = (
      <ScreenFinishDay
        settings={state.storage.settings}
        dispatch={dispatch}
        history={state.storage.history}
        userId={state.user?.id}
      />
    );
  } else if (Screen.current(state.screenStack) === "musclesProgram") {
    return (
      <ScreenMusclesProgram
        loading={state.loading}
        dispatch={dispatch}
        program={program!}
        settings={state.storage.settings}
      />
    );
  } else if (Screen.current(state.screenStack) === "musclesDay") {
    const day = program!.days[state.editProgram?.dayIndex || (state.progress[0]?.day || 1) - 1 || 0];
    return (
      <ScreenMusclesDay
        loading={state.loading}
        dispatch={dispatch}
        program={program!}
        programDay={day}
        settings={state.storage.settings}
      />
    );
  } else {
    return null;
  }

  return (
    <Fragment>
      {content}
      <Notification dispatch={dispatch} notification={state.notification} />
      <HelpOverlay dispatch={dispatch} seenIds={state.storage.helps} />
    </Fragment>
  );
}
