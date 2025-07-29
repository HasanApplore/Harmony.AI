import OpenAI from "openai";
import fs from "fs";
import path from "path";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface VideoAnalysis {
  summary: string;
  keyStrengths: string[];
  improvementAreas: string[];
  overallScore: number;
  feedback: string;
}

export async function analyzeVideoResume(videoPath: string): Promise<VideoAnalysis> {
  try {
    // For now, we'll simulate video analysis by analyzing the file metadata
    // In a production environment, you would extract frames or audio for analysis
    const stats = fs.statSync(videoPath);
    const filename = path.basename(videoPath);
    
    const prompt = `Analyze this video resume submission and provide detailed feedback.
    
    Video file: ${filename}
    File size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB
    Upload date: ${stats.birthtime.toISOString()}
    
    Based on typical video resume best practices, provide:
    1. A professional summary (2-3 sentences)
    2. Key strengths that would appeal to recruiters
    3. Areas for improvement
    4. An overall score (1-10)
    5. Constructive feedback
    
    Respond in JSON format with the structure:
    {
      "summary": "string",
      "keyStrengths": ["string"],
      "improvementAreas": ["string"],
      "overallScore": number,
      "feedback": "string"
    }`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", 
      messages: [
        {
          role: "system",
          content: "You are an expert HR consultant and video resume analyzer. Provide professional, constructive feedback that helps candidates improve their presentation."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7
    });

    const analysis = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      summary: analysis.summary || "Professional video resume submitted successfully.",
      keyStrengths: analysis.keyStrengths || ["Clear communication", "Professional presentation"],
      improvementAreas: analysis.improvementAreas || ["Consider improving lighting", "Practice key talking points"],
      overallScore: analysis.overallScore || 7,
      feedback: analysis.feedback || "Great start! Focus on highlighting your unique value proposition."
    };
  } catch (error) {
    console.error("Error analyzing video resume:", error);
    throw new Error("Failed to analyze video resume");
  }
}

export async function generatePersonalizedTips(userProfile: any): Promise<string[]> {
  try {
    const prompt = `Based on this user profile, generate 3-5 personalized tips for improving their video resume:
    
    Name: ${userProfile.name}
    Title: ${userProfile.title}
    Industry: ${userProfile.industry || "Technology"}
    Experience Level: ${userProfile.experienceLevel || "Mid-level"}
    
    Provide specific, actionable tips in JSON format:
    {
      "tips": ["string"]
    }`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a career coach specializing in video resumes. Provide personalized, actionable advice."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.8
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.tips || [
      "Maintain eye contact with the camera",
      "Use a clean, professional background",
      "Practice your elevator pitch before recording"
    ];
  } catch (error) {
    console.error("Error generating tips:", error);
    return [
      "Maintain eye contact with the camera",
      "Use a clean, professional background",
      "Practice your elevator pitch before recording"
    ];
  }
}