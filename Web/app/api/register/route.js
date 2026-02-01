// api/register/route.js


import connectDB from "@/db/connectDb"; // Your database connection function
import User from "@/models/User";       // Your Mongoose User model
import bcrypt from 'bcryptjs';          // Library for password hashing

// Handle POST requests for user registration
export async function POST(request) {
    try {
        await connectDB();
        const { email, password } = await request.json();

        // 1. Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return Response.json({ message: "User already exists." }, { status: 409 });
        }

        // 2. Hash the password for security
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // 3. Create the new user in the database
        const newUser = await User.create({
            email,
            // You should store the HASHED password, not the raw one
            password: hashedPassword, 
            username: email.split("@")[0], // Derive username from email
        });

        // Return the created user's minimal info (do not return the password hash)
        return Response.json({ 
            message: "User created successfully", 
            user: { email: newUser.email, username: newUser.username } 
        }, { status: 201 });

    } catch (error) {
        console.error("Registration Error:", error);
        return Response.json({ message: "Internal server error." }, { status: 500 });
    }
}
