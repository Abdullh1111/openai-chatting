import { OpenAI } from "openai"; // Directly import OpenAI class


export const configureOpenAI = () => {
   // Remove OpenAIApi import, use OpenAI directly
const openai = new OpenAI({
    apiKey: process.env.OPEN_AI_SECRET_KEY,
    organization: process.env.OPEN_AI_ORG,
});

    return openai
}