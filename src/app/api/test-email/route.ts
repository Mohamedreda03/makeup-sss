import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

// IMPORTANT: This is a development-only route for testing email functionality
// It should be disabled or removed in production

export async function GET(req: NextRequest) {
  // Only allow in development environment
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { message: "This endpoint is only available in development mode" },
      { status: 403 }
    );
  }

  const url = new URL(req.url);
  const email = url.searchParams.get("email");

  if (!email) {
    return NextResponse.json(
      { message: "Email parameter is required" },
      { status: 400 }
    );
  }

  try {
    const result = await sendEmail({
      to: email,
      subject: "Test Email from BrideGlam",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #e11d48;">Test Email from BrideGlam</h1>
          <p>This is a test email to verify that your email sending configuration is working correctly.</p>
          <p>Configuration details:</p>
          <ul>
            <li>Email Provider: ${
              process.env.EMAIL_USER ? "Configured ✓" : "Not configured ✗"
            }</li>
            <li>Environment: ${process.env.NODE_ENV}</li>
            <li>Date/Time: ${new Date().toISOString()}</li>
          </ul>
          <p>If you're seeing this email, your configuration is working!</p>
        </div>
      `,
    });

    if (result.success) {
      return NextResponse.json({
        message: "Test email sent successfully",
        details: { messageId: result.messageId },
      });
    } else {
      return NextResponse.json(
        {
          message: "Failed to send test email",
          error: result.error,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error sending test email:", error);
    return NextResponse.json(
      {
        message: "An error occurred while sending the test email",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
