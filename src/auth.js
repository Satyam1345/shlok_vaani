import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs"; // password hashing
import dbConnect from "./lib/dbConnect";
import User from "./backend/models/User";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        await dbConnect();
        const user = await User.findOne({ email: credentials.email });

        if (!user) {
          throw new Error("User not found");
        }

        // Ensure users who sign up via Google cannot log in via credentials
        if (user.authProvider === "google") {
          throw new Error("Please use Google Sign-In");
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
        if (!isPasswordValid) {
          throw new Error("Invalid password");
        }

        return { id: user._id, name: user.name, email: user.email };
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      await dbConnect();
    
      const existingUser = await User.findOne({ email: user.email });
    
      if (!existingUser) {
        await User.create({
          email: user.email,
          name: user.name,
          image: user.image,
          authProvider: "google",
        });
      } else if (
        existingUser &&
        account?.provider === "google" &&
        existingUser.authProvider === "email"
      ) {
        throw new Error("Please use email and password to sign in.");
      }
    
      return true;
    },
    
    async jwt({ token, user }) {
      await dbConnect();
  
      if (user) {
        const dbUser = await User.findOne({ email: user.email });
        token.id = dbUser._id.toString(); // Ensure this is the MongoDB _id
        token.email = dbUser.email;
        token.name = dbUser.name;
      }
  
      return token;
    },
  
    async session({ session, token }) {
      if (!session.user) session.user = {};
      session.user.id = token.id;
      session.user.email = token.email;
      session.user.name = token.name;
      return session;
    },
  },
  
  pages: {
    signIn: "/auth/login",
  },

  session: {
    strategy: "jwt",
  },

  secret: process.env.NEXTAUTH_SECRET,

  trustHost: true, 
});
