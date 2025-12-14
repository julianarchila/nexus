
import { createGoogleGenerativeAI } from '@ai-sdk/google';


export const gemini = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY!,
})


export const model = gemini("gemini-2.5-flash") 
