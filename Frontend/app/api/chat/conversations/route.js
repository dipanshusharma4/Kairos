import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authoptions } from "../../auth/[...nextauth]/route";
import connectDB from "@/db/connectDb";
import Conversation from "@/models/Conversation";
import Message from "@/models/Message";

export async function POST(request) {
    try {
        const session = await getServerSession(authoptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        // Create a new conversation
        const newConversation = await Conversation.create({
            userId: session.user.id,
            title: "New Chat",
        });

        return NextResponse.json(newConversation);
    } catch (error) {
        console.error("Error creating conversation:", error);
        return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
    }
}

export async function PATCH(request) {
    try {
        const session = await getServerSession(authoptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { conversationId, title } = await request.json();

        if (!conversationId || !title) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        await connectDB();

        // Find the conversation and verify ownership
        const updatedConversation = await Conversation.findOneAndUpdate(
            { _id: conversationId, userId: session.user.id },
            { title: title },
            { new: true }
        );

        if (!updatedConversation) {
            return NextResponse.json({ error: 'Conversation not found or unauthorized' }, { status: 404 });
        }

        return NextResponse.json(updatedConversation);

    } catch (error) {
        console.error("Error renaming conversation:", error);
        return NextResponse.json({ error: "Failed to rename conversation" }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const session = await getServerSession(authoptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const conversationId = searchParams.get('conversationId');

        if (!conversationId) {
            return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 });
        }

        await connectDB();

        // Delete the conversation
        const deletedConversation = await Conversation.findOneAndDelete({
            _id: conversationId,
            userId: session.user.id
        });

        if (!deletedConversation) {
            return NextResponse.json({ error: 'Conversation not found or unauthorized' }, { status: 404 });
        }

        // Also delete all messages associated with this conversation
        await Message.deleteMany({ conversationId: conversationId });

        return NextResponse.json({ message: "Conversation deleted successfully" });
    } catch (error) {
        console.error("Error deleting conversation:", error);
        return NextResponse.json({ error: "Failed to delete conversation" }, { status: 500 });
    }
}

export async function GET(request) {
    try {
        const session = await getServerSession(authoptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        // Fetch user's conversations, sorted by update time
        const conversations = await Conversation.find({ userId: session.user.id })
            .sort({ updatedAt: -1 })
            .limit(50);

        return NextResponse.json(conversations);
    } catch (error) {
        console.error("Error fetching conversations:", error);
        return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
    }
}
