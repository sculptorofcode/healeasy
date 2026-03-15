import { GoogleGenerativeAI } from '@google/generative-ai';
import { AISummary } from '../types';

let genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_GENERATIVE_AI_KEY environment variable is not set');
    }
    console.log('[AI Service] Initializing Google Generative AI client...');
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

/**
 * Extract JSON from Gemini response, handling markdown code blocks
 * @param text - The raw response text from Gemini
 * @returns Extracted JSON string
 */
function extractJsonFromResponse(text: string): string {
  // Try to extract JSON from markdown code blocks (```json ... ```)
  const jsonMarkdownMatch = text.match(/```json\s*([\s\S]*?)```/);
  if (jsonMarkdownMatch && jsonMarkdownMatch[1]) {
    return jsonMarkdownMatch[1].trim();
  }

  // Try to extract from generic code blocks (``` ... ```)
  const codeBlockMatch = text.match(/```\s*([\s\S]*?)```/);
  if (codeBlockMatch && codeBlockMatch[1]) {
    return codeBlockMatch[1].trim();
  }

  // If no code blocks, try to find JSON object directly
  const jsonObjectMatch = text.match(/\{[\s\S]*\}/);
  if (jsonObjectMatch) {
    return jsonObjectMatch[0];
  }

  // Otherwise return the raw text (it might be valid JSON anyway)
  return text.trim();
}

/**
 * Generate AI summary for a visit using Gemini
 * @param visit - The complete visit object with all details
 * @returns AISummary with meetingSummary, painPoints, actionItems, recommendedNextStep
 */
export async function generateVisitSummary(visit: {
  customerName: string;
  contactPerson: string;
  location: string;
  visitDateTime: Date | string;
  rawNotes: string;
  outcomeStatus: string;
  nextFollowUpDate: Date | string | null;
}): Promise<AISummary> {
  try {
    // Use Gemini 2.5 Flash for fast response - adjust model choice as needed
    const model = getGenAI().getGenerativeModel({ model: 'gemini-2.5-flash' });

    const visitDate = new Date(visit.visitDateTime).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const followUpDate = visit.nextFollowUpDate
      ? new Date(visit.nextFollowUpDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : 'Not scheduled';

    const prompt = `You are a sales assistant. Based on the complete visit details below, generate a structured, concise summary in JSON format.

=== VISIT DETAILS ===
Customer: ${visit.customerName}
Contact Person: ${visit.contactPerson}
Location: ${visit.location}
Visit Date/Time: ${visitDate}
Meeting Outcome: ${visit.outcomeStatus.replace(/_/g, ' ')}
Next Follow-up: ${followUpDate}

=== MEETING NOTES ===
${visit.rawNotes}

Respond ONLY with valid JSON (no markdown, no explanations). The response must be a single JSON object:
{
  "meetingSummary": "2-3 sentence overview of the meeting and key discussion points",
  "painPoints": ["identified pain point 1", "identified pain point 2"],
  "actionItems": ["specific action item 1", "specific action item 2"],
  "recommendedNextStep": "the most important next action based on outcome status and follow-up date"
}

Guidelines:
- meetingSummary: Concise 2-3 sentences capturing the essence and outcome
- painPoints: 2-5 specific problems or challenges identified (extract from notes)
- actionItems: 1-4 concrete next steps or tasks (link to follow-up date if applicable)
- recommendedNextStep: ONE clear, actionable recommendation aligned with "${visit.outcomeStatus.replace(/_/g, ' ')}"
- Be concise and business-focused
- If no clear items exist for a field, use reasonable inferences from context`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const rawText = response.text().trim();

    // Extract JSON from response (handles markdown code blocks)
    const jsonText = extractJsonFromResponse(rawText);

    // Parse JSON response
    let parsed: any;
    try {
      parsed = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('[AI Service] Failed to parse extracted JSON:', jsonText);
      throw new Error('Failed to parse AI response - invalid JSON');
    }

    // Validate response structure
    if (
      !parsed.meetingSummary ||
      !Array.isArray(parsed.painPoints) ||
      !Array.isArray(parsed.actionItems) ||
      !parsed.recommendedNextStep
    ) {
      console.error('[AI Service] Invalid response structure:', parsed);
      throw new Error('AI response missing required fields');
    }

    // Return structured summary
    const aiSummary: AISummary = {
      meetingSummary: parsed.meetingSummary,
      painPoints: parsed.painPoints || [],
      actionItems: parsed.actionItems || [],
      recommendedNextStep: parsed.recommendedNextStep,
      generatedAt: new Date().toISOString(),
    };
    return aiSummary;
  } catch (error: any) {
    console.error('[AI Service] Error generating summary:', error?.message);
    throw error;
  }
}
