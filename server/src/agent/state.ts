import { Annotation, MessagesAnnotation } from "@langchain/langgraph";

export const INTENTS = ["query", "booking", "complaint", "other"] as const;

export type Intent = (typeof INTENTS)[number];

/**
 * Graph state shared by every node.
 * - messages: the conversation transcript; the built-in reducer appends new messages.
 * - intent: what the classifier decided the latest customer message is about.
 * - escalated: true once a complaint has been logged and a person should follow up.
 */
export const AgentState = Annotation.Root({
    messages: MessagesAnnotation.spec.messages,
    intent: Annotation<Intent | null>({
        reducer: (_currentIntent, nextIntent) => nextIntent,
        default: () => null,
    }),
    escalated: Annotation<boolean>({
        reducer: (_currentValue, nextValue) => nextValue,
        default: () => false,
    }),
});

export type AgentStateType = typeof AgentState.State;

export type AgentStateUpdate = typeof AgentState.Update;
