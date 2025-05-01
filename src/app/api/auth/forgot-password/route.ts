import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { randomUUID } from "crypto";
import { sendEmail, createPasswordResetEmailHtml } from "@/lib/email";

// Schema for request validation
const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

// Token expiration duration in seconds (1 hour)
const TOKEN_EXPIRATION = 60 * 60;

export async function POST(req: NextRequest) {
  try {
    // Parse and validate request body
    const body = await req.json();
    const result = forgotPasswordSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { message: "Invalid email address" },
        { status: 400 }
      );
    }

    const { email } = result.data;

    // Find user by email
    const user = await db.user.findUnique({
      where: { email },
    });

    // Important security note: Don't reveal whether a user exists or not
    // Always return success even if the user doesn't exist
    if (!user) {
      console.log(`No user found with email: ${email}`);
      // Return success to prevent email enumeration attacks
      return NextResponse.json(
        {
          message:
            "If your email exists in our system, you will receive a password reset link shortly.",
        },
        { status: 200 }
      );
    }

    // Generate a unique reset token
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRATION * 1000);

    // Save the reset token to the database
    await db.passwordReset.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // Create the reset URL
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

    // Send the password reset email
    const emailHtml = createPasswordResetEmailHtml(
      resetUrl,
      user.name || undefined
    );

    try {
      const emailResult = await sendEmail({
        to: email,
        subject: "Reset Your Password - BrideGlam",
        html: emailHtml,
      });

      if (!emailResult.success) {
        console.error(
          "Failed to send password reset email:",
          emailResult.error
        );
      } else {
        console.log(
          `Password reset email sent to ${email}, messageId: ${emailResult.messageId}`
        );
      }
    } catch (emailError) {
      console.error("Error sending password reset email:", emailError);
    }

    return NextResponse.json(
      {
        message:
          "If your email exists in our system, you will receive a password reset link shortly.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in forgot password:", error);
    return NextResponse.json(
      { message: "An error occurred while processing your request." },
      { status: 500 }
    );
  }
}
