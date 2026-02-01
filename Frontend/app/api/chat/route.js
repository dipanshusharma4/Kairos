import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // 1. Get the data
    const { prompt, history } = await request.json();
    
    // Get the key (Checks both possible names)
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'API Key missing' }, { status: 500 });
    }

    // 2. Prepare the History for the API
    // This ensures the format is exactly what Google expects: { role, parts: [{ text }] }
    const contents = (Array.isArray(history) ? history : []).map(item => ({
      role: item.role === 'user' ? 'user' : 'model',
      parts: [{ text: item.parts?.[0]?.text || item.text || "" }]
    }));

    // Add the user's *current* message to the end of the list
    contents.push({
      role: 'user',
      parts: [{ text: prompt }]
    });

    // 3. Define the System Instruction (Persona)
    const systemInstruction = {
      parts: [{ text: "You are Sora, a kind, empathetic, and encouraging anime-style pet companion for a teenager. Your responses should be short, supportive, and use friendly, relatable language. Avoid clinical jargon." }]
    };

    // 4. Send Direct Request to Google (Bypassing the SDK Library)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: contents,
        systemInstruction: systemInstruction
      })
    });

    const data = await response.json();

    // 5. Handle Errors
    if (!response.ok) {
      console.error("Google API Error Detail:", data);
      return NextResponse.json({ error: data.error?.message || "Google API Error" }, { status: response.status });
    }

    // 6. Success! Extract text
    const text = data.candidates[0].content.parts[0].text;
    return NextResponse.json({ text });

  } catch (error) {
    console.error("Server Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}