This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### 1. Environment Setup

First, create a `.env.local` file by copying the example file:

```bash
copy .env.local.example .env.local
```

Then, update the environment variables in `.env.local` with your backend server URLs:

```env
# Backend Server Configuration (REQUIRED)
NEXT_PUBLIC_API_URL=http://your-backend-url:8080

# WebSocket Configuration (REQUIRED)
NEXT_PUBLIC_WS_URL=ws://your-backend-url:8081/ws
NEXT_PUBLIC_TRENCHES_WS_URL=ws://your-backend-url:8081/ws
NEXT_PUBLIC_CHART_WS_URL=ws://your-backend-url:8081/ws
NEXT_PUBLIC_TRANSACTIONS_WS_URL=ws://your-backend-url:8081/ws
NEXT_PUBLIC_TRADES_WS_URL=ws://your-backend-url:8081/ws

# GraphQL Configuration (REQUIRED)
NEXT_PUBLIC_GRAPHQL_ENDPOINT=http://your-backend-url:8080/graphql
```

**Important:** All WebSocket URLs are required for the application to function properly.

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Development Server

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
