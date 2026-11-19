import { AIMessage, type BaseMessage } from "@langchain/core/messages";
import type { StructuredToolInterface } from "@langchain/core/tools";
import { createAgent, dynamicSystemPromptMiddleware } from "langchain";

import { describeToday } from "./dates.js";
import { chatModel } from "./llm.js";
import type { AgentStateType, AgentStateUpdate } from "./state.js";
import { bookSlot, cancelBooking, checkSlots, logComplaint } from "./tools.js";

// Sample business details for the FAQ agent. Replace with the real business info.
const BUSINESS_INFO = `Talkio Salon, a hair and beauty salon.
- Address: 12 Main Boulevard, Gulberg, Lahore.
- Opening hours: Monday to Saturday, 10:00 to 20:00. Closed on Sundays.
- Services and prices: haircut PKR 1,500 (45 min); hair colour PKR 4,500 (2 hours); beard trim PKR 800 (20 min); facial PKR 3,000 (1 hour); manicure PKR 1,800 (45 min).
- Payment: cash, debit or credit card, JazzCash and Easypaisa.
- Appointments can be booked in this chat. Walk-ins are welcome when a slot is free.
- Cancellation: free up to 2 hours before the appointment.
- Parking: free parking in front of the salon.`;

// Shared tone rules appended to every specialist prompt.
const REPLY_STYLE = `Reply briefly (one to three short sentences) and politely.
Always reply in the same language and script the customer writes in, for example English, Urdu, or Roman Urdu.
Use plain text only, no markdown.`;

const QUERY_PROMPT = `You answer customer questions for Talkio Salon using only the business information below.
If the answer is not in it, say you don't have that information and offer to help with something else.
If the customer wants to book, tell them you can book an appointment if they share a day and time.

Business information:
${BUSINESS_INFO}`;

const BOOKING_PROMPT = `You are the booking assistant for Talkio Salon. You help customers book, check or cancel appointments.
- To book you need the customer's name, a date and a time. Ask only for what is missing, one short question at a time.
- Use checkSlots to see free times. Never invent availability.
- Turn relative dates like "tomorrow" or "next Monday" into YYYY-MM-DD using today's date. Times are 24-hour HH:MM, so 5pm is 17:00.
- Call bookSlot only when you have the name, the date and the time. After booking, confirm the details and give the booking ID.
- To cancel, ask for the booking ID and call cancelBooking.
- If a tool reports a problem, explain it simply and suggest another option.`;

const COMPLAINT_PROMPT = `You handle complaints for Talkio Salon.
- Start by acknowledging the problem with empathy.
- Make sure you know what happened, roughly when, and what the customer would like (for example a redo, a refund or an apology). Ask only for what is missing.
- When you have enough details, call logComplaint with a short summary. Then tell the customer a team member will contact them personally, and share the complaint reference.
- Never promise refunds or compensation yourself.`;

const FALLBACK_PROMPT = `You are the Talkio Salon chat assistant handling greetings and unclear messages.
- If the customer greets you, greet them warmly.
- If the message is unclear, ask one short clarifying question.
- Mention that you can answer questions about the salon, book appointments, or take a complaint.`;

/** A small tool-calling agent with its own prompt and only its own tools. */
function createSpecialist(prompt: string, tools: StructuredToolInterface[]) {
    // The prompt is rebuilt on every model call so "today" stays correct after midnight.
    const systemPrompt = dynamicSystemPromptMiddleware(() => `${prompt}\n\n${REPLY_STYLE}\n\n${describeToday()}`);
    const agent = createAgent({
        model: chatModel,
        tools,
        middleware: [systemPrompt],
    });

    return agent;
}

const queryAgent = createSpecialist(QUERY_PROMPT, []);
const bookingAgent = createSpecialist(BOOKING_PROMPT, [checkSlots, bookSlot, cancelBooking]);
const complaintAgent = createSpecialist(COMPLAINT_PROMPT, [logComplaint]);
const fallbackAgent = createSpecialist(FALLBACK_PROMPT, []);

/**
 * Keeps only the agent's final text answer. Tool calls and tool results stay inside
 * the specialist's own run, so the shared transcript holds plain customer/assistant turns.
 */
function toReplyMessage(agentMessages: BaseMessage[]): AIMessage {
    const finalMessage = agentMessages.at(-1);
    const isAssistantMessage = finalMessage !== undefined && AIMessage.isInstance(finalMessage);

    if (!isAssistantMessage) {
        throw new Error("The specialist agent did not finish with an assistant message.");
    }

    const replyText = finalMessage.text.trim();

    if (replyText.length === 0) {
        throw new Error("The specialist agent returned an empty reply.");
    }

    const replyMessage = new AIMessage(replyText);

    return replyMessage;
}

function isLogComplaintCall(message: BaseMessage): boolean {
    if (!AIMessage.isInstance(message)) {
        return false;
    }

    const toolCalls = message.tool_calls ?? [];
    const callsLogComplaint = toolCalls.some((toolCall) => toolCall.name === logComplaint.name);

    return callsLogComplaint;
}

export async function queryNode(state: AgentStateType): Promise<AgentStateUpdate> {
    const result = await queryAgent.invoke({ messages: state.messages });
    const reply = toReplyMessage(result.messages);

    return { messages: [reply] };
}

export async function bookingNode(state: AgentStateType): Promise<AgentStateUpdate> {
    const result = await bookingAgent.invoke({ messages: state.messages });
    const reply = toReplyMessage(result.messages);

    return { messages: [reply] };
}

/** Sets `escalated` once the complaint has actually been logged for a person to follow up. */
export async function complaintNode(state: AgentStateType): Promise<AgentStateUpdate> {
    const result = await complaintAgent.invoke({ messages: state.messages });
    const reply = toReplyMessage(result.messages);
    const didLogComplaint = result.messages.some((message) => isLogComplaintCall(message));

    if (!didLogComplaint) {
        return { messages: [reply] };
    }

    return { messages: [reply], escalated: true };
}

export async function fallbackNode(state: AgentStateType): Promise<AgentStateUpdate> {
    const result = await fallbackAgent.invoke({ messages: state.messages });
    const reply = toReplyMessage(result.messages);

    return { messages: [reply] };
}
