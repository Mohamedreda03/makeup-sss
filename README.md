This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Password Reset Email Setup

To enable password reset emails, you need to set up the following environment variables:

1. Create or update your `.env` file with the following variables:

```
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=BrideGlam <your-gmail@gmail.com>
```

2. To get an app password for Gmail:

   - Go to your Google Account > Security
   - Enable 2-Step Verification if not already enabled
   - Go to App passwords (under "Signing in to Google")
   - Select "Mail" as the app and "Other" as the device (name it "BrideGlam")
   - Copy the generated 16-character password and use it as EMAIL_PASSWORD in your .env file

3. For Outlook accounts:
   - Go to account.live.com/proofs/Manage/additional
   - Add a new app password
   - Copy the generated password and use it as EMAIL_PASSWORD in your .env file

Note: Never commit your .env file with real credentials to version control.
