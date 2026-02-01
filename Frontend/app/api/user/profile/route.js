import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authoptions } from "../../auth/[...nextauth]/route";
import connectDB from "@/db/connectDb";
import User from "@/models/User";

export async function PATCH(request) {
    try {
        const session = await getServerSession(authoptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { username, image } = await request.json();

        const updateData = {};

        if (username) {
            if (username.trim().length < 2) {
                return NextResponse.json({ error: 'Username must be at least 2 characters long' }, { status: 400 });
            }
            updateData.username = username.trim();
        }

        if (image) {
            // Basic validation for base64 or url could go here, but strict check is complex.
            // We assume frontend sends valid base64 data url or https url.
            updateData.image = image;
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
        }

        await connectDB();

        const updatedUser = await User.findByIdAndUpdate(
            session.user.id,
            updateData,
            { new: true } // Return the updated document
        );

        if (!updatedUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            username: updatedUser.username,
            image: updatedUser.image
        });

    } catch (error) {
        console.error("Update Profile Error:", error);
        return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }
}
