
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authoptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/db/connectDb";
import Activity from "@/models/Activity";

export async function DELETE(request, { params }) {
    try {
        const session = await getServerSession(authoptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;
        await connectDB();

        const activity = await Activity.findOneAndDelete({
            _id: id,
            userId: session.user.id // Ensure user owns the activity
        });

        if (!activity) {
            return NextResponse.json({ error: "Activity not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Activity deleted successfully" });
    } catch (error) {
        console.error("Delete Activity Error:", error);
        return NextResponse.json({ error: "Failed to delete activity" }, { status: 500 });
    }
}

export async function PATCH(request, { params }) {
    try {
        const session = await getServerSession(authoptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;
        const body = await request.json(); // { type, duration }

        await connectDB();

        // Validate duration if present
        if (body.duration !== undefined && Number(body.duration) < 0) {
            return NextResponse.json({ error: 'Duration cannot be negative' }, { status: 400 });
        }

        const updateData = {};
        if (body.type) updateData.type = body.type;
        if (body.duration) updateData.duration = parseInt(body.duration);

        const activity = await Activity.findOneAndUpdate(
            { _id: id, userId: session.user.id },
            { $set: updateData },
            { new: true }
        );

        if (!activity) {
            return NextResponse.json({ error: "Activity not found" }, { status: 404 });
        }

        return NextResponse.json(activity);
    } catch (error) {
        console.error("Update Activity Error:", error);
        return NextResponse.json({ error: "Failed to update activity" }, { status: 500 });
    }
}
