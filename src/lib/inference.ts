import OpenAI from "openai";
import { ChatCompletionTool } from "openai/resources/chat/completions.mjs";

const openai = new OpenAI({
  baseURL: "https://api.cohere.ai/compatibility/v1",
  apiKey: process.env.COHERE_API_KEY,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function generateContent(contents: string, responseFormat?: any, tools?: ChatCompletionTool[]) {
  const response = await openai.chat.completions.create({
    model: "command-a-03-2025",
    messages: [{ role: "user", content: contents }],
    ...(tools && { tools }),
    ...(responseFormat && { response_format: responseFormat }),
  });

  return response.choices[0].message.content;
}
