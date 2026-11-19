import { type BaseMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { z } from "zod";

import { chatModel } from "./llm.js";
import { type AgentStateType, type AgentStateUpdate, INTENTS, type Intent } from "./state.js";

// How much recent conversation the classifier sees, so short follow-ups keep their topic.
const CLASSIFIER_HISTORY_SIZE = 6;

const CLASSIFIER_PROMPT = `You classify the customer's LATEST message in the customer-service chat of an aesthetic and dermatology clinic.
Choose exactly one intent:
- query: questions about the clinic, such as treatments, prices, downtime, opening hours, location, payment or policies.
- booking: booking, checking, changing or cancelling an appointment or consultation, including follow-ups that only give booking details such as a date, a time or a name.
- complaint: the customer is unhappy, reports a problem or a reaction after a treatment, or is adding details to a complaint.
- other: greetings, thanks, small talk, or anything unclear.
Earlier messages are context only. A short follow-up like "tomorrow at 5pm" or just a name continues the topic being discussed. If the customer clearly changes topic, classify the new topic.`;

const IntentSchema = z.object({
    intent: z.enum(INTENTS).describe("The intent of the customer's latest message."),
});

// Structured output makes the model answer with exactly one of the four intents.
const intentClassifier = chatModel.withStructuredOutput(IntentSchema, { name: "classify_intent" });

/** Classifier node: one LLM call that writes `intent` to the state. */
export async function classifierNode(state: AgentStateType): Promise<AgentStateUpdate> {
    const recentMessages = selectRecentMessages(state.messages);
    const promptMessages: BaseMessage[] = [new SystemMessage(CLASSIFIER_PROMPT)];
    const classifierInput = promptMessages.concat(recentMessages);
    const classification = await intentClassifier.invoke(classifierInput);

    return { intent: classification.intent };
}

/** Router for the conditional edge: the intent is also the name of the next node. */
export function routeByIntent(state: AgentStateType): Intent {
    if (state.intent === null) {
        return "other";
    }

    return state.intent;
}

/**
 * The last few messages, trimmed so they start with a customer message.
 * Some providers behind OpenRouter reject a conversation that opens with an assistant turn.
 */
function selectRecentMessages(messages: BaseMessage[]): BaseMessage[] {
    const recentMessages = messages.slice(-CLASSIFIER_HISTORY_SIZE);
    const firstCustomerIndex = recentMessages.findIndex((message) => HumanMessage.isInstance(message));

    if (firstCustomerIndex < 0) {
        return recentMessages;
    }

    const trimmedMessages = recentMessages.slice(firstCustomerIndex);

    return trimmedMessages;
}
