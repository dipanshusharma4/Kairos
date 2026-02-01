import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authoptions } from "../../auth/[...nextauth]/route";
import connectDB from "@/db/connectDb";
import Mood from "@/models/Mood";

export async function POST(request) {
    try {
        const session = await getServerSession(authoptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { mood } = await request.json();
        if (!mood) return NextResponse.json({ error: 'Mood required' }, { status: 400 });

        await connectDB();

        // Check if entry for today exists? Or allow multiple?
        // Let's allow multiple but dashboard only shows latest.
        const newMood = await Mood.create({
            userId: session.user.id,
            mood: mood
        });

        return NextResponse.json(newMood);
    } catch (error) {
        console.error("Save Mood Error:", error);
        return NextResponse.json({ error: "Failed to save mood" }, { status: 500 });
    }
}
