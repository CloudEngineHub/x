import { useEvent } from 'rc-util';
import React from 'react';
import { XAgent } from '../useXAgent';
import useSyncState from './useSyncState';

export type SimpleType = string | number | boolean | object;

export type MessageStatus = 'local' | 'loading' | 'success' | 'error';

type RequestPlaceholderFn<Message extends SimpleType> = (
  message: Message,
  info: { messages: Message[] },
) => Message;

type RequestFallbackFn<Message extends SimpleType> = (
  message: Message,
  info: { error: Error; messages: Message[] },
) => Message | Promise<Message>;

export interface XChatConfig<
  AgentMessage extends SimpleType = string,
  BubbleMessage extends SimpleType = AgentMessage,
> {
  /** If the onRequest method is used, the agent parameter is required */
  agent?: XAgent<AgentMessage>;

  defaultMessages?: DefaultMessageInfo<AgentMessage>[];

  /** Convert agent message to bubble usage message type */
  parser?: (message: AgentMessage) => BubbleMessage | BubbleMessage[];

  requestPlaceholder?: AgentMessage | RequestPlaceholderFn<AgentMessage>;
  requestFallback?: AgentMessage | RequestFallbackFn<AgentMessage>;
}

export interface MessageInfo<Message extends SimpleType> {
  id: number | string;
  message: Message;
  status: MessageStatus;
}

export type DefaultMessageInfo<Message extends SimpleType> = Pick<MessageInfo<Message>, 'message'> &
  Partial<Omit<MessageInfo<Message>, 'message'>>;

export type RequestResultObject<Message> = {
  message: Message | Message[];
  status: MessageStatus;
};

export type RequestResult<Message extends SimpleType> =
  | Message
  | Message[]
  | RequestResultObject<Message>
  | RequestResultObject<Message>[];

export type StandardRequestResult<Message extends SimpleType> = Omit<
  RequestResultObject<Message>,
  'message' | 'status'
> & {
  message: Message;
  status?: MessageStatus;
};

function toArray<T>(item: T | T[]): T[] {
  return Array.isArray(item) ? item : [item];
}

export default function useXChat<
  AgentMessage extends SimpleType = string,
  ParsedMessage extends SimpleType = AgentMessage,
>(config: XChatConfig<AgentMessage, ParsedMessage>) {
  const { defaultMessages, agent, requestFallback, requestPlaceholder, parser } = config;

  // ========================= Agent Messages =========================
  const idRef = React.useRef(0);

  const [messages, setMessages, getMessages] = useSyncState<MessageInfo<AgentMessage>[]>(() =>
    (defaultMessages || []).map((info, index) => ({
      id: `default_${index}`,
      status: 'local',
      ...info,
    })),
  );

  const createMessage = (message: AgentMessage, status: MessageStatus) => {
    const msg: MessageInfo<AgentMessage> = {
      id: `msg_${idRef.current}`,
      message,
      status,
    };

    idRef.current += 1;

    return msg;
  };

  // ========================= BubbleMessages =========================
  const parsedMessages = React.useMemo(() => {
    const list: MessageInfo<ParsedMessage>[] = [];

    messages.forEach((agentMsg) => {
      const rawParsedMsg = parser ? parser(agentMsg.message) : agentMsg.message;
      const bubbleMsgs = toArray(rawParsedMsg as ParsedMessage);

      bubbleMsgs.forEach((bubbleMsg, bubbleMsgIndex) => {
        let key = agentMsg.id;
        if (bubbleMsgs.length > 1) {
          key = `${key}_${bubbleMsgIndex}`;
        }

        list.push({
          id: key,
          message: bubbleMsg,
          status: agentMsg.status,
        });
      });
    });

    return list;
  }, [messages]);

  // ============================ Request =============================
  const getFilteredMessages = (msgs: MessageInfo<AgentMessage>[]) =>
    msgs
      .filter((info) => info.status !== 'loading' && info.status !== 'error')
      .map((info) => info.message);

  // For agent to use. Will filter out loading and error message
  const getRequestMessages = () => getFilteredMessages(getMessages());

  const onRequest = useEvent((message: AgentMessage) => {
    if (!agent)
      throw new Error('If the onRequest method is used, the agent parameter is required!');

    let loadingMsgId: number | string | null = null;

    // Add placeholder message
    setMessages((ori) => {
      let nextMessages = [...ori, createMessage(message, 'local')];

      if (requestPlaceholder) {
        let placeholderMsg: AgentMessage;

        if (typeof requestPlaceholder === 'function') {
          // typescript has bug that not get real return type when use `typeof function` check
          placeholderMsg = (requestPlaceholder as RequestPlaceholderFn<AgentMessage>)(message, {
            messages: getFilteredMessages(nextMessages),
          });
        } else {
          placeholderMsg = requestPlaceholder;
        }

        const loadingMsg = createMessage(placeholderMsg, 'loading');
        loadingMsgId = loadingMsg.id;

        nextMessages = [...nextMessages, loadingMsg];
      }

      return nextMessages;
    });

    // Request
    let updatingMsgId: number | string | null = null;
    const updateMessage = (message: AgentMessage, status: MessageStatus) => {
      let msg = getMessages().find((info) => info.id === updatingMsgId);

      if (!msg) {
        // Create if not exist
        msg = createMessage(message, status);
        setMessages((ori) => {
          const oriWithoutPending = ori.filter((info) => info.id !== loadingMsgId);
          return [...oriWithoutPending, msg!];
        });
        updatingMsgId = msg.id;
      } else {
        // Update directly
        setMessages((ori) => {
          return ori.map((info) => {
            if (info.id === updatingMsgId) {
              return {
                ...info,
                message,
                status,
              };
            }
            return info;
          });
        });
      }

      return msg;
    };

    agent.request(
      {
        message,
        messages: getRequestMessages(),
      },
      {
        onUpdate: (message) => {
          updateMessage(message, 'loading');
        },
        onSuccess: (message) => {
          updateMessage(message, 'success');
        },
        onError: async (error: Error) => {
          if (requestFallback) {
            let fallbackMsg: AgentMessage;

            // Update as error
            if (typeof requestFallback === 'function') {
              // typescript has bug that not get real return type when use `typeof function` check
              fallbackMsg = await (requestFallback as RequestFallbackFn<AgentMessage>)(message, {
                error,
                messages: getRequestMessages(),
              });
            } else {
              fallbackMsg = requestFallback;
            }

            setMessages((ori) => [
              ...ori.filter((info) => info.id !== loadingMsgId && info.id !== updatingMsgId),
              createMessage(fallbackMsg, 'error'),
            ]);
          } else {
            // Remove directly
            setMessages((ori) => {
              return ori.filter((info) => info.id !== loadingMsgId && info.id !== updatingMsgId);
            });
          }
        },
      },
    );
  });

  return {
    onRequest,
    messages,
    parsedMessages,
    setMessages,
  } as const;
}
