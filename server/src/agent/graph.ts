import { END, MemorySaver, START, StateGraph } from "@langchain/langgraph";

import { classifierNode, routeByIntent } from "./classifier.js";
import { bookingNode, complaintNode, fallbackNode, queryNode } from "./specialists.js";
import { AgentState } from "./state.js";

// Conversation memory, kept in process memory per thread_id. It is lost when the server restarts.
const checkpointer = new MemorySaver();

/**
 * START -> classifier -> (router picks by intent) -> one specialist -> END
 * Compiled once when the server starts and reused for every request.
 */
export const customerServiceGraph = new StateGraph(AgentState)
    .addNode("classifier", classifierNode)
    .addNode("query", queryNode)
    .addNode("booking", bookingNode)
    .addNode("complaint", complaintNode)
    .addNode("other", fallbackNode)
    .addEdge(START, "classifier")
    .addConditionalEdges("classifier", routeByIntent, ["query", "booking", "complaint", "other"])
    .addEdge("query", END)
    .addEdge("booking", END)
    .addEdge("complaint", END)
    .addEdge("other", END)
    .compile({ checkpointer });
