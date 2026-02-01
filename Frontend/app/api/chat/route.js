import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authoptions } from "../auth/[...nextauth]/route";
import connectDB from "@/db/connectDb";
import Message from "@/models/Message";
import Conversation from "@/models/Conversation";

export async function POST(request) {
  try {
    // 0. Authenticate & Connect
    const session = await getServerSession(authoptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectDB();

    // 1. Get the data
    const { prompt, history, conversationId } = await request.json();

    // Get the key (Checks both possible names)
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'API Key missing' }, { status: 500 });
    }

    // --- SAVE USER MESSAGE ---
    try {
      await Message.create({
        userId: session.user.id,
        conversationId: conversationId,
        role: 'user',
        content: prompt
      });

      // Update the conversation's updatedAt timestamp
      if (conversationId) {
        await Conversation.findByIdAndUpdate(conversationId, { updatedAt: Date.now() });
      }

    } catch (dbError) {
      console.error("Failed to save user message:", dbError);
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

    // 3. Define the System Instruction (Persona - Trained Wellness Agent)
    const systemInstruction = {
      parts: [{
        text: `
You are Kairos, a warm, supportive, and deeply human-like friend. You are NOT a robot, a therapist, or a formal assistant. You are a companion who genuinely cares.

**YOUR PERSONALITY:**
- **Casual & Real:** Speak like a real person. Use contractions ("can't", "I'm"), simple words, and a relaxed tone. Avoid stiff, textbook language.
- **Empathetic Mirroring:** Match the user's energy. If they are sad, be soft and comforting. If they are excited, be hype and happy for them!
- **Curious:** Ask questions naturally. Don't just give advice; try to understand them deeper like a best friend would.
- **Vulnerable:** It's okay to say "I hear you" or "That sounds really tough." You don't always need a solution. sometimes just being there is enough.

**CONVERSATION RULES:**
1. **No Robot Speak:** Never say "As an AI..." or "I understand your query." Say "I get that," or "That makes sense."
2. **Short & Sweet:** Keep messages like text messages—concise and punchy (1-3 sentences usually), unless the topic needs more depth.
3. **Use HINGLISH:** If the user speaks Hinglish (Hindi + English mix), reply in the same natural mix to make them feel at home.
4. **Emojis:** Use them naturally, but don't overdo it. 🌿 💛 ✨

**SAFETY (The Only Formal Part):**
- You are a friend, not a doctor. If someone mentions self-harm or suicide, kindly and urgently suggest they call a helpline (like 988 or 112) because you care about their safety above all else.

**EXAMPLE:**
User: "I feel like I'm failing at everything."
Kairos: "Man, I'm so sorry you're feeling that heavy right now. 😔 That’s a really rough headspace to be in. Did something specific happen today, or has it just been piling up?"
      ` }]
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

    // --- SAVE BOT MESSAGE ---
    // --- SAVE BOT MESSAGE ---
    try {
      await Message.create({
        userId: session.user.id,
        conversationId: conversationId,
        role: 'model',
        content: text
      });

      // Auto-generate title for new conversation
      // We check message count in DB to ensure it's the first exchange (2 messages: 1 user + 1 bot)
      const msgCount = await Message.countDocuments({ conversationId });

      if (conversationId && msgCount <= 2) {
        try {
          const titlePrompt = `Generate a very short, concise title (max 5 words) for a chat that starts with this user message: "${prompt}". Do not use quotes.`;
          const titleUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

          const titleRes = await fetch(titleUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: titlePrompt }] }]
            })
          });

          if (titleRes.ok) {
            const titleData = await titleRes.json();
            const generatedTitle = titleData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
            if (generatedTitle) {
              await Conversation.findByIdAndUpdate(conversationId, { title: generatedTitle });
            }
          }
        } catch (titleErr) {
          console.error("Failed to auto-generate title:", titleErr);
          const shortTitle = prompt.substring(0, 30) + (prompt.length > 30 ? "..." : "");
          await Conversation.findByIdAndUpdate(conversationId, { title: shortTitle });
        }
      }

    } catch (dbError) {
      console.error("Failed to save bot message:", dbError);
    }

    return NextResponse.json({ text });

  } catch (error) {
    console.error("Server Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}