import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';
import { CONTEXT_EXTRACTION_PROMPT } from '@/lib/gemini';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const { transcript } = await request.json();

    if (!transcript || typeof transcript !== 'string' || transcript.trim().length === 0) {
      return NextResponse.json(
        { error: 'Transcript is required' },
        { status: 400 },
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      // Return a mock response in development if no API key is configured
      return NextResponse.json({
        chief_complaint: null,
        diagnosis: null,
        history_summary: null,
        examination_notes: null,
        instructions: [],
        dietary_notes: [],
        follow_up: null,
        tests_ordered: [],
        mentioned_drugs: [],
      });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const result = await model.generateContent([
      CONTEXT_EXTRACTION_PROMPT,
      `\nTRANSCRIPT:\n${transcript}`,
    ]);

    const text = result.response.text();

    // Strip markdown code fences if present
    let cleaned = text.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const parsed = JSON.parse(cleaned);
    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Context extraction error:', error);
    return NextResponse.json(
      { error: 'Failed to extract context from transcript' },
      { status: 500 },
    );
  }
}
