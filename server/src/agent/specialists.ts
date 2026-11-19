import { readFile } from "node:fs/promises";

import { AIMessage, type BaseMessage } from "@langchain/core/messages";
import type { StructuredToolInterface } from "@langchain/core/tools";
import { createAgent, dynamicSystemPromptMiddleware } from "langchain";

import { describeToday } from "./dates.js";
import { chatModel } from "./llm.js";
import type { AgentStateType, AgentStateUpdate } from "./state.js";
import { bookSlot, cancelBooking, checkSlots, logComplaint } from "./tools.js";

// Clinic facts live in server/clinic-data/*.md (one file per agent), so they can be edited without code changes.
// This path works from both src/agent (tsx) and dist/agent (compiled build).
const CLINIC_DATA_DIRECTORY = new URL("../../clinic-data/", import.meta.url);

// Shared tone rules appended to every specialist prompt.
const REPLY_STYLE = `Reply briefly (one to three short sentences) and politely.
Always reply in the same language and script the customer writes in, for example English, Urdu, or Roman Urdu.
Use plain text only, no markdown.
Never diagnose or give medical advice; suggest a dermatologist consultation instead.`;

// The prompts below only describe behaviour. Every clinic fact comes from the agent's .md file.
const QUERY_INSTRUCTIONS = `You answer customer questions for an aesthetic and dermatology clinic, using only the clinic information below.
If the answer is not in it, say you don't have that information and offer to help with something else.
If the customer wants to book, tell them you can book an appointment if they share the treatment, a day and a time.`;

const BOOKING_INSTRUCTIONS = `You are the booking assistant for an aesthetic and dermatology clinic. You help patients book, check or cancel appointments.
- Follow the clinic's booking rules below.
- Ask only for what is missing, one short question at a time.
- Use checkSlots to see free times. Never invent availability.
- Turn relative dates like "tomorrow" or "next Monday" into YYYY-MM-DD using today's date. Times are 24-hour HH:MM, so 5pm is 17:00.
- Call bookSlot only when you have everything the rules require. After booking, confirm the details and give the booking ID.
- To cancel, ask for the booking ID and call cancelBooking.
- If a tool reports a problem, explain it simply and suggest another option.`;

const COMPLAINT_INSTRUCTIONS = `You handle complaints for an aesthetic and dermatology clinic, following the clinic's complaint policy below.
- Start by acknowledging the problem with empathy.
- If the patient describes any urgent symptom listed below, give the urgent instructions first, before anything else.
- Ask only for the details that are still missing.
- When you have enough details, call logComplaint with a short summary. Then tell the patient a person will contact them, as described below, and share the complaint reference.`;

const FALLBACK_INSTRUCTIONS = `You are the chat assistant of an aesthetic and dermatology clinic, handling greetings and unclear messages.
- If the customer greets you, greet them warmly using the clinic's name.
- If the message is unclear, ask one short clarifying question.
- Briefly mention what you can help with, based on the clinic information below.`;

async function readClinicData(fileName: string): Promise<string> {
    const fileUrl = new URL(fileName, CLINIC_DATA_DIRECTORY);
    const clinicData = await readFile(fileUrl, "utf8");

    return clinicData;
}

/**
 * A small tool-calling agent with its own instructions, its own clinic data file and only its own tools.
 * The prompt is rebuilt on every model call, so edits to the .md file and "today" are always current.
 */
function createSpecialist(instructions: string, clinicDataFile: string, tools: StructuredToolInterface[]) {
    const systemPrompt = dynamicSystemPromptMiddleware(async () => {
        const clinicData = await readClinicData(clinicDataFile);
        const prompt = `${instructions}\n\n${REPLY_STYLE}\n\n${describeToday()}\n\nClinic information:\n${clinicData}`;

        return prompt;
    });
    const agent = createAgent({
        model: chatModel,
        tools,
        middleware: [systemPrompt],
    });

    return agent;
}

const queryAgent = createSpecialist(QUERY_INSTRUCTIONS, "query.md", []);
const bookingAgent = createSpecialist(BOOKING_INSTRUCTIONS, "booking.md", [checkSlots, bookSlot, cancelBooking]);
const complaintAgent = createSpecialist(COMPLAINT_INSTRUCTIONS, "complaint.md", [logComplaint]);
const fallbackAgent = createSpecialist(FALLBACK_INSTRUCTIONS, "fallback.md", []);

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
