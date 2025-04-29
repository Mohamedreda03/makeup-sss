import { User } from "next-auth";

// Extend the User object from NextAuth.js
export interface ExtendedUser extends User {
  id: string;
  name?: string | null;
  email?: string | null;
  role: "CUSTOMER" | "ADMIN" | "ARTIST";
}
