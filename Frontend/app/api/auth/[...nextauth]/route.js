import NextAuth from "next-auth";
import AppleProvider from "next-auth/providers/apple";
import FacebookProvider from "next-auth/providers/facebook";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import GitHubProvider from "next-auth/providers/github";
import User from "@/models/User";
import connectDB from "@/db/connectDb";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

export const authoptions = NextAuth({
  providers: [
    // OAuth authentication providers...
    // GitHubProvider({
    //   clientId: process.env.GITHUB_ID,
    //   clientSecret: process.env.GITHUB_SECRET,
    // }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    // AppleProvider({
    //   clientId: process.env.APPLE_ID,
    //   clientSecret: process.env.APPLE_SECRET
    // }),
    // FacebookProvider({
    //   clientId: process.env.FACEBOOK_ID,
    //   clientSecret: process.env.FACEBOOK_SECRET
    // }),
    // Passwordless / email sign in
    // EmailProvider({
    //   server: process.env.MAIL_SERVER,
    //   from: 'NextAuth.js <no-reply@example.com>'
    // }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        await connectDB();

        const user = await User.findOne({
    $or: [ // <-- The key MongoDB operator
        { email: credentials.identifier },
        { username: credentials.identifier }
    ]
         }).select("+password"); // Select '+'password' if not selected by default

        if (user && user.password) {
          // Check if the provided password matches the HASHED password in the DB
          

          const isMatch = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (isMatch) {
            // Success: Return a user object with public info
            return {
              id: user._id.toString(), // Must return a string ID
              email: user.email,
              name: user.username,
              // Do NOT return the hashed password
            };
          }
        }
        // Failure: Return null. Next-Auth will handle the error page redirect.
        return null;
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      if (account?.provider === "google") {
        await connectDB();
        const userEmail = profile.email;

        // Check for existing OAuth user (prevents duplicate entries)
        const currentUser = await User.findOne({ email: userEmail });
        if (!currentUser) {
          await User.create({
            email: userEmail,
            username: userEmail.split("@")[0],
          });
        }
      }
      return true; // Allow sign in to proceed
    },
    // ... your session callback remains the same ...
    async session({ session, user, token }) {
      await connectDB(); // Ensure DB connection for session refresh
      const dbUser = await User.findOne({ email: session.user.email });
      if (dbUser) {
        // You might need to update your session object with custom data here
        session.user.name = dbUser.username;
      }
      return session;
    },
  },
  // Ensure you use JWT strategy since you are using Credentials provider
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
});

const handler = NextAuth(authoptions);
// Export both GET and POST handlers
export { authoptions as GET, authoptions as POST };
