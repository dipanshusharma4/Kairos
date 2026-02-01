import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authoptions } from "../../auth/[...nextauth]/route";
import connectDB from "@/db/connectDb";
import Message from "@/models/Message";

export async function GET(request) {
    try {
        const session = await getServerSession(authoptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        // Get conversationId from query params
        const { searchParams } = new URL(request.url);
        const conversationId = searchParams.get('conversationId');

        const query = { userId: session.user.id };
        if (conversationId) {
            query.conversationId = conversationId;
        }

        const messages = await Message.find(query)
            .sort({ createdAt: 1 }) // Ascending order (oldest first)
            .limit(100); // Limit to last 100 messages to prevent overload

        // Format for the frontend
        const formattedMessages = messages.map(msg => ({
            sender: msg.role === 'user' ? 'You' : 'Kairos',
            text: msg.content,
            role: msg.role
        }));

        return NextResponse.json(formattedMessages);
    } catch (error) {
        console.error("Error fetching history:", error);
        return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
    }
}
