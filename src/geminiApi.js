import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.error("Gemini API Key is missing. Please set VITE_GEMINI_API_KEY in your .env file.");
}

// Note: This constructor syntax is for the newer @google/generative-ai library
const ai = new GoogleGenerativeAI(API_KEY);

async function sendPromptToGemini(userPrompt) {
  if (!userPrompt || userPrompt.trim() === "") {
    return "Please provide a prompt to the AI.";
  }
  if (!API_KEY) {
    return "API Key not configured. Cannot send prompt.";
  }

  try {
    // This method call is also specific to the newer library
    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(userPrompt);

    if (result && result.response) {
      const text = result.response.text();
      console.log("Gemini API Response:", text);
      return text;
    } else {
      console.error("API call succeeded but the response object was not valid.");
      return "An unexpected error occurred with the API response.";
    }
  } catch (error) {
    console.error("Error communicating with Gemini API:", error);
    if (error.message.includes("403")) {
      return "Authentication failed. Please check your API key.";
    }
    return "Sorry, I couldn't get a response. Please try again later.";
  }
}

export default sendPromptToGemini;
