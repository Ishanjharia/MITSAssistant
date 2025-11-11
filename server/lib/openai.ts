import OpenAI from "openai";
import pLimit from "p-limit";
import pRetry from "p-retry";

// This is using Replit's AI Integrations service, which provides OpenAI-compatible API access without requiring your own OpenAI API key.
// Reference: javascript_openai_ai_integrations blueprint
export const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

function isRateLimitError(error: any): boolean {
  const errorMsg = error?.message || String(error);
  return (
    errorMsg.includes("429") ||
    errorMsg.includes("RATELIMIT_EXCEEDED") ||
    errorMsg.toLowerCase().includes("quota") ||
    errorMsg.toLowerCase().includes("rate limit")
  );
}

export interface StructuredResponse {
  summary: string;
  bullets: string[];
  hasAnswer: boolean;
}

export async function generateChatResponse(
  userMessage: string,
  context: string
): Promise<StructuredResponse> {
  return await pRetry(
    async () => {
      try {
        console.log("[OpenAI] Making request with context length:", context.length);
        const response = await openai.chat.completions.create({
          model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
          messages: [
            {
              role: "system",
              content: `You are MITS-Assistant, a helpful, concise, and factual chatbot for Madhav Institute of Technology & Science (MITS), Gwalior.

You MUST respond in the following JSON format:
{
  "summary": "One-line summary of the answer",
  "bullets": ["Key point 1", "Key point 2", "Key point 3"],
  "hasAnswer": true
}

Rules:
1. Use ONLY the provided context when answering. Do not hallucinate.
2. The "summary" should be a single concise sentence (10-20 words) answering the question.
3. The "bullets" array should contain 2-5 key points with specific details from the context.
4. Set "hasAnswer" to true if you found relevant information in the context, false otherwise.
5. If hasAnswer is false, set summary to suggest where to check (e.g., "I don't have this information. Please check the admissions page or contact MITS directly.") and bullets to an empty array.
6. For step-by-step instructions, put each step as a bullet point.
7. Include specific numbers, dates, phone numbers, emails when available in context.
8. Be professional, friendly, and campus-helpful.

CONTEXT FROM MITS WEBSITE:
${context}

Remember: Respond ONLY with valid JSON in the specified format.`
            },
            {
              role: "user",
              content: userMessage
            }
          ],
          max_completion_tokens: 4096,
          response_format: { type: "json_object" }
        });
        console.log("[OpenAI] Received response, parsing...");
        console.log("[OpenAI] Response structure:", JSON.stringify(response, null, 2));
        
        const content = response.choices[0]?.message?.content;
        console.log("[OpenAI] Content from response:", content);
        if (!content) {
          console.error("[OpenAI] No content in response! Returning fallback.");
          return {
            summary: "I apologize, but I couldn't generate a response. Please try again.",
            bullets: [],
            hasAnswer: false
          };
        }

        const parsed = JSON.parse(content);
        console.log("[OpenAI] Parsed response:", parsed);
        return {
          summary: parsed.summary || "Unable to process the response.",
          bullets: Array.isArray(parsed.bullets) ? parsed.bullets : [],
          hasAnswer: parsed.hasAnswer ?? false
        };
      } catch (error: any) {
        console.error("[OpenAI] Error during API call:", error.message);
        if (isRateLimitError(error)) {
          throw error;
        }
        throw new pRetry.AbortError(error);
      }
    },
    {
      retries: 3,
      minTimeout: 1000,
      maxTimeout: 10000,
      factor: 2,
    }
  );
}
