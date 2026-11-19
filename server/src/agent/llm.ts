import { ChatOpenAI } from "@langchain/openai";

function readRequiredEnv(name: string): string {
    const value = process.env[name];

    if (!value) {
        throw new Error(`Missing environment variable ${name}. Copy server/.env.example to server/.env and fill it in.`);
    }

    return value;
}

// A chat customer is waiting, so give up after a couple of retries instead of LangChain's default of 6.
const MAX_LLM_RETRIES = 2;

const baseUrl = readRequiredEnv("LLM_BASE_URL");
const apiKey = readRequiredEnv("LLM_API_KEY");
const modelName = readRequiredEnv("LLM_MODEL");

/**
 * One chat model shared by the classifier and every specialist agent.
 * OpenRouter exposes an OpenAI-compatible Chat Completions API, so ChatOpenAI
 * works with just a different base URL. Pick a model that supports tool calling
 * and structured outputs. LangChain sends a few OpenAI model names (`*-pro`,
 * `codex`, `gpt-5.6`) to the Responses API instead, so avoid those here.
 */
export const chatModel = new ChatOpenAI({
    model: modelName,
    apiKey,
    configuration: { baseURL: baseUrl },
    maxRetries: MAX_LLM_RETRIES,
});
