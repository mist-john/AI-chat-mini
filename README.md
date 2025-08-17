# Koã AI Chat Clone

A beautiful AI chatbot application built with Next.js, featuring a Koa AI Agent-inspired design with anime character illustrations and a modern chat interface.

## Features

- 🎨 **Beautiful Design**: Inspired by Koa AI Agent with anime character illustrations
- 🤖 **AI Chat**: Powered by OpenAI GPT-4o mini
- 📱 **Responsive**: Works on desktop and mobile devices
- 🔒 **Message Limits**: 100 messages per client per day
- 💾 **Client Tracking**: Persistent client identification and usage tracking
- 🎭 **Modern UI**: Smooth animations and gradient backgrounds

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory and add your API keys:

```bash
# .env.local
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here
MONGODB_URI=your_mongodb_connection_string_here
```

**Important**: Replace `your_openai_api_key_here` with your actual OpenAI API key.

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_OPENAI_API_KEY` | Your OpenAI API key for GPT-4o mini | Yes |
| `MONGODB_URI` | MongoDB connection string | Yes |

## How to Get an OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key and paste it in your `.env.local` file

## How to Set Up MongoDB

### Option 1: MongoDB Atlas (Cloud - Recommended)
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account and cluster
3. Get your connection string
4. Add it to your `.env.local` file as `MONGODB_URI`

### Option 2: Local MongoDB
1. Install MongoDB locally
2. Start MongoDB service
3. Use connection string: `mongodb://localhost:27017/koa-ai-chat`
4. Add it to your `.env.local` file as `MONGODB_URI`

### Connection String Format
```
mongodb+srv://username:password@cluster.mongodb.net/koa-ai-chat?retryWrites=true&w=majority
```

## Features Explained

### Message Limit System
- Each client gets 100 messages per day
- Messages reset every 24 hours
- Chat is completely disabled when limit is reached
- Client data is stored in localStorage

### Design Features
- Circular gradient background with smooth transitions
- Anime character illustrations on left and right sides
- Modern chat interface with gradient buttons
- Responsive grid layout

### AI Chat Features
- Uses GPT-4o mini for intelligent responses
- Conversation memory and context
- Error handling and user feedback
- Loading states and smooth animations

## Project Structure

```
koa-ai-clone/
├── src/
│   ├── app/
│   │   ├── page.tsx          # Main landing page
│   │   └── api/
│   │       └── client/
│   │           ├── status/   # Client status API
│   │           └── increment/ # Message increment API
│   ├── components/
│   │   └── ChatModal.tsx     # AI chat interface
│   ├── lib/
│   │   └── mongodb.ts        # MongoDB connection
│   └── models/
│       └── Client.ts         # Client data model
├── public/                    # Static assets
├── .env.local                 # Environment variables (create this)
└── README.md                  # This file
```

## Security Notes

- Never commit your `.env.local` file to version control
- The `.gitignore` file already excludes all `.env*` files
- API keys are only accessible on the client side (using `NEXT_PUBLIC_` prefix)
- Client data is now stored securely in MongoDB with server-side validation
- Message limits are enforced server-side, preventing client-side manipulation
- IP addresses and user agents are tracked for security monitoring

## Customization

### Changing Message Limits
Edit the message limit in `src/components/ChatModal.tsx`:
```typescript
if (data.messageCount >= 100) { // Change this number
  setMessageLimitReached(true);
}
```

### Modifying Background Colors
Update the gradient colors in `src/app/page.tsx`:
```typescript
background: 'radial-gradient(circle at center, #000000 0%, #000000 70%, #f35d38 100%)'
```

## Troubleshooting

### API Key Issues
- Ensure your `.env.local` file exists and contains the correct API key
- Check that the environment variable name is exactly `NEXT_PUBLIC_OPENAI_API_KEY`
- Restart your development server after adding environment variables

### Message Limit Issues
- Clear localStorage to reset client data: `localStorage.removeItem('koaClientData')`
- Check browser console for any error messages

## License

This project is open source and available under the MIT License.
