import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface PostSuggestion {
  title: string;
  content: string;
  tone: string;
  hashtags: string[];
}

function generateFallbackSuggestions(keyword: string): PostSuggestion[] {
  const keywordLower = keyword.toLowerCase();
  
  // Professional networking templates
  const templates = [
    {
      title: `Professional Insights on ${keyword}`,
      content: `Reflecting on recent trends in ${keyword}, I've noticed how rapidly this field is evolving. As professionals, it's crucial we stay ahead of these changes and adapt our strategies accordingly. 

What I've learned is that success in ${keyword} requires both technical expertise and strong collaboration skills. The most impactful projects I've seen combine innovative thinking with practical implementation.

I'd love to hear your thoughts - how are you approaching ${keyword} in your current role?`,
      tone: "informative",
      hashtags: [keyword.replace(/\s+/g, ''), "ProfessionalDevelopment", "CareerGrowth", "Networking"]
    },
    {
      title: `Why ${keyword} Matters More Than Ever`,
      content: `Every challenge is an opportunity in disguise, and that's especially true when it comes to ${keyword}. 

I've seen firsthand how focusing on ${keyword} can transform not just individual careers, but entire organizations. It's not just about keeping up with trends - it's about leading them.

To anyone feeling overwhelmed by the pace of change: remember that every expert was once a beginner. The key is consistent learning and staying curious.

What's one thing about ${keyword} that has surprised you recently?`,
      tone: "inspirational",
      hashtags: [keyword.replace(/\s+/g, ''), "Inspiration", "GrowthMindset", "Leadership"]
    },
    {
      title: `My Journey with ${keyword}`,
      content: `I still remember my first encounter with ${keyword} - I was completely lost and honestly a bit intimidated. Fast forward to today, and it's become one of my strongest areas.

The turning point came when I stopped trying to learn everything at once and focused on one aspect at a time. I found mentors, joined communities, and most importantly, wasn't afraid to ask questions.

Now, as I help others navigate their own journey with ${keyword}, I'm reminded that growth happens outside our comfort zone. The key is taking that first step.

What's been your biggest learning moment in your professional journey?`,
      tone: "personal",
      hashtags: [keyword.replace(/\s+/g, ''), "PersonalGrowth", "Journey", "Mentorship"]
    }
  ];

  return templates;
}

export async function generatePostSuggestions(
  keyword: string,
  userProfile?: {
    name?: string;
    title?: string;
    industry?: string;
    skills?: string[];
  }
): Promise<PostSuggestion[]> {
  // Check if OpenAI API key is available and valid
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.length < 20) {
    // Return fallback suggestions instead of throwing an error
    return generateFallbackSuggestions(keyword);
  }

  try {
    // Test if the API key is valid by making a small request first
    await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: "test" }],
      max_tokens: 1
    });

    const userContext = userProfile ? 
      `User is ${userProfile.name || 'a professional'} working as ${userProfile.title || 'a professional'} ${userProfile.industry ? `in ${userProfile.industry}` : ''}. Skills: ${userProfile.skills?.join(', ') || 'Various professional skills'}.` 
      : 'User is a professional seeking to create engaging content.';

    const prompt = `You are a professional content creator helping users write engaging LinkedIn-style posts. 

User Context: ${userContext}

Generate 3 diverse post suggestions for the keyword/topic: "${keyword}"

Each post should be:
- Professional and engaging
- 100-200 words
- Include relevant hashtags
- Different in tone (informative, inspirational, personal story)
- Relevant to professional networking

Return the response as JSON in this exact format:
{
  "suggestions": [
    {
      "title": "Brief title for the post",
      "content": "The full post content...",
      "tone": "informative|inspirational|personal",
      "hashtags": ["hashtag1", "hashtag2", "hashtag3"]
    }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", 
      messages: [
        {
          role: "system",
          content: "You are a professional content creator specializing in LinkedIn posts. Always respond with valid JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 1000
    });

    const result = JSON.parse(response.choices[0].message.content || '{"suggestions": []}');
    return result.suggestions || [];

  } catch (error) {
    console.error("Error generating post suggestions:", error);
    
    // If OpenAI fails, fall back to template suggestions
    if (error instanceof Error && (
      error.message.includes('API key') ||
      error.message.includes('401') ||
      error.message.includes('authentication')
    )) {
      console.log("OpenAI API key invalid, using fallback suggestions");
      return generateFallbackSuggestions(keyword);
    }
    
    // For other errors, also use fallback
    console.log("OpenAI request failed, using fallback suggestions");
    return generateFallbackSuggestions(keyword);
  }
}

export async function enhanceUserPost(
  content: string,
  userProfile?: {
    name?: string;
    title?: string;
    industry?: string;
  }
): Promise<{
  enhancedContent: string;
  suggestedHashtags: string[];
}> {
  try {
    const userContext = userProfile ? 
      `User is ${userProfile.name || 'a professional'} working as ${userProfile.title || 'a professional'} ${userProfile.industry ? `in ${userProfile.industry}` : ''}.` 
      : 'User is a professional.';

    const prompt = `You are helping to enhance a professional social media post.

User Context: ${userContext}

Original post content: "${content}"

Please:
1. Enhance the content to be more engaging while keeping the original meaning
2. Suggest relevant professional hashtags
3. Keep it under 250 words
4. Maintain a professional tone

Return the response as JSON in this exact format:
{
  "enhancedContent": "The enhanced post content...",
  "suggestedHashtags": ["hashtag1", "hashtag2", "hashtag3"]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are a professional content enhancer. Always respond with valid JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.6,
      max_tokens: 800
    });

    const result = JSON.parse(response.choices[0].message.content || '{"enhancedContent": "", "suggestedHashtags": []}');
    return {
      enhancedContent: result.enhancedContent || content,
      suggestedHashtags: result.suggestedHashtags || []
    };

  } catch (error) {
    console.error("Error enhancing post:", error);
    throw new Error("Failed to enhance post");
  }
}