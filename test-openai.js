import "dotenv/config";
import OpenAI from "openai";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

async function testOpenAI() {
  try {
    console.log("Testing OpenAI API connection...");
    console.log("API Key starts with:", process.env.OPENAI_API_KEY?.substring(0, 20) + "...");
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: "Hello! Please respond with 'OpenAI API is working correctly for Harmony AI!'"
        }
      ],
      max_tokens: 20
    });

    console.log("✅ OpenAI API Test Successful!");
    console.log("Response:", response.choices[0].message.content);
    
  } catch (error) {
    console.error("❌ OpenAI API Test Failed:");
    console.error(error.message);
    
    if (error.message.includes('API key')) {
      console.error("🔑 Check your API key configuration in .env file");
    } else if (error.message.includes('quota')) {
      console.error("💰 API quota exceeded - check your OpenAI billing");
    } else if (error.message.includes('rate limit')) {
      console.error("⏱️ Rate limit exceeded - wait a moment and try again");
    }
  }
}

testOpenAI(); 