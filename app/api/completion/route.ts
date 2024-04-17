import Anthropic from "@anthropic-ai/sdk";
import { AnthropicStream, StreamingTextResponse } from "ai";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const runtime = "edge";

const ratelimit =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Ratelimit({
      redis: new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      }),
      limiter: Ratelimit.slidingWindow(10, "5 m"),
      analytics: true,
    })
    : false;

export async function POST(req: Request) {
  if (ratelimit) {
    const ip = req.headers.get("x-real-ip") ?? "local";
    const rl = await ratelimit.limit(ip);
    if (!rl.success) {
      return new Response("Rate limit exceeded", { status: 429 });
    }
  }

  const { text, prompt, apiKey } = await req.json();

  if (!prompt) return new Response("Prompt is required", { status: 400 });

  const anthropicApiKey = apiKey || process.env.ANTHROPIC_API_KEY;

  if (!anthropicApiKey) {
    return new Response("API key is required", { status: 400 });
  }

  const anthropic = new Anthropic({ apiKey: anthropicApiKey });

  const response = await anthropic.messages.create({
    model: "claude-3-haiku-20240307",
    stream: true,
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `You are a text editor. You will be given a prompt and a text to edit, which may be empty or incomplete. Edit the text to match the prompt while maintaining a similar sentence structure to the original text. Only respond with the full edited version of the text - do not include any other information, context, or explanation. Do not include the prompt or otherwise preface your response. Do not enclose the response in quotes.
        When making edits, please keep the following in mind:
        1. Try to maintain a similar sentence structure to the original text to ensure the sentence-level diff is meaningful and accurate.
        2. If you need to introduce new sentences or remove existing sentences, make sure to do so in a way that the sentence-level diff can highlight these changes appropriately.
        3. Focus on accurately modifying, adding, or removing words as needed to match the prompt. The word-level diff will highlight these changes regardless of the sentence structure.
        4. If the provided text is empty or if there are any errors in processing the text, please respond with an empty string to indicate that the diff should not be generated.
        
        Prompt: ${prompt}
        Text: ${text}`,
      },
    ],
  });

  const stream = AnthropicStream(response);
  return new StreamingTextResponse(stream);
}