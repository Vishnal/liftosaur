import * as React from "react";
import { useCallback, useRef } from "react";
import { Thunk } from "../ducks/thunks";
import { IDispatch } from "../ducks/types";
import { IAllComments, IAllFriends, IAllLikes } from "../models/state";
import { DateUtils } from "../utils/date";
import { Button } from "./button";
import { ButtonLike } from "./buttonLike";
import { IconDelete } from "./iconDelete";
import { IconSpinner } from "./iconSpinner";
import { inputClassName } from "./input";

interface ICommentsProps {
  historyRecordId: number;
  currentUserId: string;
  nickname?: string;
  friends: IAllFriends;
  likes: IAllLikes;
  friendId?: string;
  comments: IAllComments;
  dispatch: IDispatch;
}

export function Comments(props: ICommentsProps): JSX.Element {
  const { friendId, dispatch, currentUserId } = props;
  const historyRecordId = `${props.historyRecordId}`;
  const comments = props.comments.comments[historyRecordId] || [];
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    const text = textAreaRef.current!.value;
    dispatch(Thunk.postComment(historyRecordId, friendId || currentUserId, text));
  }, [historyRecordId, friendId]);

  return (
    <div className="px-2 pb-2">
      <h4 className="flex text-sm font-bold" data-cy="comments-header">
        <div className="flex-1">Comments - {comments.length}</div>
        <div>
          <ButtonLike
            dispatch={dispatch}
            historyRecordId={props.historyRecordId}
            userId={currentUserId}
            friendId={friendId}
            likes={props.likes}
          />
        </div>
      </h4>
      <ul className="px-2 pb-1">
        {comments.map((comment) => {
          const name =
            currentUserId === comment.userId ? props.nickname : props.friends.friends[comment.userId]?.user.nickname;

          return (
            <li className="py-2 border-b border-gray-300" data-cy="comment">
              <div className="flex text-xs italic text-gray-600" data-cy="comment-user">
                <div className="flex-1">{name || comment.userId}</div>
                <div>{DateUtils.formatWithTime(comment.timestamp)}</div>
              </div>
              <div className="flex">
                <div className="flex-1" data-cy="comment-text">
                  {comment.text}
                </div>
                {currentUserId === comment.userId && (
                  <div>
                    {!props.comments.isRemoving[comment.id] ? (
                      <button
                        data-cy="comment-delete"
                        onClick={() => dispatch(Thunk.removeComment(historyRecordId, comment.id))}
                      >
                        <IconDelete />
                      </button>
                    ) : (
                      <IconSpinner width={20} height={20} />
                    )}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <label className="text-xs font-bold" htmlFor="new-comment">
        New Comment:
      </label>
      <div className="flex items-start">
        <textarea
          data-cy="new-comment-input"
          ref={textAreaRef}
          id="new-comment"
          name="new-comment"
          placeholder="Great job!"
          className={`${inputClassName} flex-1`}
        />
        <Button
          disabled={props.comments.isPosting}
          data-cy="new-comment-submit"
          kind="blue"
          className="ml-2"
          onClick={handleSend}
        >
          {props.comments.isPosting ? <IconSpinner width={20} height={20} /> : "Send"}
        </Button>
      </div>
    </div>
  );
}
