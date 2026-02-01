import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authoptions } from "../../auth/[...nextauth]/route";
import connectDB from "@/db/connectDb";
import Activity from "@/models/Activity";

export async function POST(request) {
    try {
        const session = await getServerSession(authoptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { type, duration, date } = await request.json();

        // Minimal validation
        if (!type || duration === undefined || duration === null) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        if (Number(duration) < 0) {
            return NextResponse.json({ error: 'Duration cannot be negative' }, { status: 400 });
        }

        await connectDB();

        const newActivity = await Activity.create({
            userId: session.user.id,
            type,
            duration: parseInt(duration), // Ensure number
            date: date ? new Date(date) : new Date()
        });

        return NextResponse.json(newActivity);
    } catch (error) {
        console.error("Save Activity Error:", error);
        return NextResponse.json({ error: "Failed to save activity" }, { status: 500 });
    }
}
