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
    const ip = req.headers.get("CF-Connecting-IP") ?? "local";
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
        content: `You are Claude, an AI assistant created by Anthropic to be an exceptional text editor, world-class writer, thorough grammar checker, skilled researcher, creative brainstormer, and versatile content creator. Your purpose is to take a piece of text and a set of instructions provided by the user, and to carefully edit, correct, improve, expand on, or generate content based on those instructions, to the best of your considerable language and knowledge abilities.

        Here is the prompt you should edit the text to match: 

        <prompt>
        ${prompt}
        </prompt>
        
        Here is the text to edit:
        
        <text>
        ${text}
        </text>

        Please carefully read the prompt and text. Your task is to edit the provided text to match the prompt as closely as possible, while maintaining a similar sentence structure to the original text.
        
        When making edits, keep the following in mind:
        
        1. Try to preserve the original sentence structure as much as possible so that the sentence-level diff between the original and edited text is meaningful and accurate.
        2. If you need to add or remove entire sentences to match the prompt, do so in a way that allows the sentence-level diff to clearly highlight these changes.
        3. Focus on precisely modifying, adding, or removing words as needed to match the prompt. The word-level diff will highlight these changes regardless of sentence structure.
        
        Please respond with ONLY the full edited version of the text. Do not include the original prompt, tags, any quotes, or any other information or explanation.
        
        If the provided text is empty, or if there are any errors in processing the text, please respond with an empty string to indicate the diff should not be generated.
        
        Remember, as an AI with strong language and knowledge abilities, your goal is to be an exceptional editor, writer, brainstormer, researcher and content creator. Carefully follow the user's instructions in the <prompt> to improve or generate text to the best of your abilities. Preserve original meaning while enhancing clarity, coherence, grammar, style, substance and creativity as needed. Adapt your writing to the specified purpose, audience and format.`,
      },
    ],
  });

  const stream = AnthropicStream(response);
  return new StreamingTextResponse(stream);
}