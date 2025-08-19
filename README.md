# Koa AI Chat Bot

A sophisticated AI chatbot application built with Next.js, featuring Koa AI Agent with comprehensive Koasync knowledge, secret training capabilities, and intelligent search through GitBook documentation.

## 🚀 Features

### Core AI Chat
- **Intelligent Responses**: Powered by OpenAI GPT-4o mini with built-in Koasync knowledge
- **Context Awareness**: Maintains conversation context and provides relevant answers
- **Response Length Control**: Automatically provides short/clear responses or detailed information based on user requests
- **Jupiter Integration Knowledge**: Special handling for planned features with consistent messaging

### Secret Training System
- **Hidden Training Mode**: Activate with secret code to teach the bot new information
- **AI Analysis**: Automatic analysis of training content with intent, sentiment, and topic extraction
- **Database Storage**: Training data stored in both `training_data` and `gitbook_content` collections
- **Natural Learning**: Bot responds conversationally when learning new information

### GitBook Integration
- **Comprehensive Knowledge Base**: Full GitBook documentation stored in MongoDB
- **Enhanced Search**: Deep content search across titles, sections, and training data
- **Smart Scoring**: Intelligent ranking of search results with keyword matching
- **Training Data Integration**: User-provided training becomes part of searchable knowledge

### Client Management
- **Message Limits**: 100 messages per client per day with server-side validation
- **Persistent Tracking**: Client identification and usage tracking in MongoDB
- **Security Monitoring**: IP address and user agent tracking

### Modern UI/UX
- **Beautiful Design**: Anime character illustrations with gradient backgrounds
- **Responsive Layout**: Works seamlessly on desktop and mobile devices
- **Smooth Animations**: Modern chat interface with loading states
- **Training Indicators**: Visual feedback for active training sessions

## 🛠️ Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Required
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here
MONGODB_URI=your_mongodb_connection_string_here

# Secret Training Codes (Optional - will use defaults if not set)
SECRET_TRAINING_CODE=
EXIT_TRAINING_CODE=

# Public versions for frontend (Optional)
NEXT_PUBLIC_SECRET_TRAINING_CODE=
NEXT_PUBLIC_EXIT_TRAINING_CODE=
```

### 3. Initialize GitBook Data

```bash
# Start the development server
npm run dev

# In a separate terminal, initialize the database with GitBook content
curl -X POST http://localhost:3000/api/training/gitbook-init
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔑 Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NEXT_PUBLIC_OPENAI_API_KEY` | OpenAI API key for GPT-4o mini | Yes | - |
| `MONGODB_URI` | MongoDB connection string | Yes | - |
| `SECRET_TRAINING_CODE` | Code to activate training mode | No | `` |
| `EXIT_TRAINING_CODE` | Code to exit training mode | No | `` |
| `NEXT_PUBLIC_SECRET_TRAINING_CODE` | Frontend version of secret code | No | Same as `SECRET_TRAINING_CODE` |
| `NEXT_PUBLIC_EXIT_TRAINING_CODE` | Frontend version of exit code | No | Same as `EXIT_TRAINING_CODE` |

## 🗄️ MongoDB Setup

### Option 1: MongoDB Atlas (Cloud - Recommended)
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account and cluster
3. Get your connection string
4. Add it to your `.env.local` file as `MONGODB_URI`

### Option 2: Local MongoDB
1. Install MongoDB locally
2. Start MongoDB service
3. Use connection string: `mongodb://localhost:27017/koa-ai-chat`

### Connection String Format
```
mongodb+srv://username:password@cluster.mongodb.net/koa-ai-chat?retryWrites=true&w=majority
```

## 🎯 Secret Training System

### How to Activate Training Mode
1. **Start Training**: Send the secret code as the first line of your message:
   ```
  
   - Non-custodial: They don't hold your funds
   - Jupiter integration: Trades execute through Jupiter
   - Wallet-based: You sign transactions from your wallet
   ```

2. **Continue Training**: All subsequent messages are automatically analyzed and stored
3. **Exit Training**: Send `exit training mode` to stop the session

### What Happens During Training
- **AI Analysis**: Each message is analyzed for intent, sentiment, topics, and complexity
- **Database Storage**: Data stored in both `training_data` (session management) and `gitbook_content` (searchable knowledge)
- **Natural Responses**: Bot responds conversationally, acknowledging what it's learning
- **Future Integration**: Training data becomes part of the bot's searchable knowledge base

### Training Data Structure
```typescript
{
  title: "Non-Custodial Trading - User Training",
  content: "User's training message",
  section: "User Training Data",
  metadata: {
    userQuestion: "Original message",
    aiAnalysis: { intent, sentiment, topics, complexity },
    trainingType: "user_provided",
    keywords: ["extracted", "topics"],
    sessionId: "unique_session_id"
  },
  keywords: ["searchable", "terms", "for", "future", "queries"]
}
```

## 🔍 Enhanced Search System

### Search Capabilities
- **Title Search**: Exact and partial matching
- **Content Search**: Deep content analysis with scoring
- **Training Data**: User-provided training content included in search results
- **Keyword Matching**: Intelligent keyword extraction and matching
- **Context Relevance**: Scoring based on search term relevance

### Search Scoring Algorithm
- **Exact Matches**: Highest priority (+50 points)
- **Content Matches**: Detailed content analysis (+45 points)
- **Training Data Bonus**: User training content gets priority (+30 points)
- **Keyword Matches**: Extracted keywords from training data (+15 per match)
- **Intent Matching**: User intent alignment (+25 points)
- **Partial Matching**: Word-level partial matches (+10 per word)

### Search Results
- **Prioritized Results**: Training data appears first for user questions
- **Official Content**: GitBook documentation for general queries
- **Combined Responses**: Intelligent merging of training and official content
- **Consistent Links**: Always includes links to GitBook and X (Twitter)

## 📚 GitBook Integration

### Content Structure
- **Official Documentation**: Complete GitBook content stored in MongoDB
- **Training Data**: User-provided training integrated into searchable knowledge
- **Metadata Enrichment**: Enhanced with AI analysis and keywords
- **Version Control**: Content can be updated and reinitialized

### API Endpoints
- **`/api/training/gitbook-init`**: Initialize database with GitBook content
- **`/api/training/gitbook-search`**: Search through all content (official + training)
- **`/api/training/secret-training`**: Handle secret training sessions
- **`/api/admin/training-data`**: Admin access to training sessions
- **`/api/admin/training-gitbook`**: Admin access to GitBook content

## 🏗️ Project Structure

```
KOA_CHAT/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Main landing page
│   │   ├── layout.tsx                  # Root layout
│   │   ├── globals.css                 # Global styles
│   │   └── api/                        # API routes
│   │       ├── client/                 # Client management
│   │       │   ├── status/             # Client status API
│   │       │   └── increment/          # Message increment API
│   │       ├── training/               # Training system
│   │       │   ├── gitbook-init/       # Initialize GitBook data
│   │       │   ├── gitbook-search/     # Search GitBook content
│   │       │   └── secret-training/    # Secret training API
│   │       └── admin/                  # Admin endpoints
│   │           ├── clients/            # Client management
│   │           ├── training-data/      # Training session data
│   │           └── training-gitbook/   # GitBook content management
│   ├── components/
│   │   └── ChatModal.tsx               # Main chat interface
│   ├── lib/
│   │   └── mongodb.ts                  # MongoDB connection utilities
│   ├── models/                         # Database models
│   │   ├── Client.ts                   # Client data model
│   │   ├── GitBookContent.ts           # GitBook content model
│   │   └── TrainingData.ts             # Training session model
│   └── types/                          # TypeScript type definitions
├── public/                             # Static assets
├── .env.local                          # Environment variables
├── README.md                           # This file
├── DEPLOYMENT_GUIDE.md                 # Deployment instructions
├── MONGODB_INTEGRATION.md              # MongoDB setup guide
└── package.json                        # Dependencies and scripts
```

## 🔧 API Reference

### Client Management
- **`POST /api/client/status`**: Get client status and message count
- **`POST /api/client/increment`**: Increment message count

### Training System
- **`POST /api/training/secret-training`**: Handle secret training sessions
- **`POST /api/training/gitbook-init`**: Initialize GitBook database
- **`POST /api/training/gitbook-search`**: Search through all content

### Admin Endpoints
- **`GET /api/admin/training-data`**: View training sessions
- **`DELETE /api/admin/training-data`**: Delete training sessions
- **`GET /api/admin/training-gitbook`**: View GitBook content

## 🎨 Customization

### Changing Message Limits
Edit the message limit in `src/components/ChatModal.tsx`:
```typescript
if (data.messageCount >= 100) { // Change this number
  setMessageLimitReached(true);
}
```

### Modifying Secret Codes
Update in `.env.local`:
```bash
SECRET_TRAINING_CODE=your_new_secret_code
EXIT_TRAINING_CODE=your_new_exit_code
```

### Customizing Training Responses
Edit `generateNaturalResponse` function in `src/app/api/training/secret-training/route.ts`

## 🚨 Security Features

- **Environment Variables**: All sensitive data stored in `.env.local`
- **Server-side Validation**: Message limits enforced server-side
- **Client Tracking**: IP addresses and user agents monitored
- **Training Isolation**: Training sessions isolated by user ID
- **Admin Protection**: Admin endpoints require proper authentication

## 🐛 Troubleshooting

### Common Issues

#### API Key Problems
- Ensure `.env.local` exists with correct variable names
- Restart development server after environment changes
- Check browser console for error messages

#### MongoDB Connection Issues
- Verify `MONGODB_URI` format and credentials
- Check network connectivity to MongoDB
- Ensure database exists and is accessible

#### Training Mode Not Working
- Verify secret codes in `.env.local`
- Check browser console for API errors
- Ensure MongoDB is running and accessible

#### Search Not Finding Results
- Initialize GitBook data with `/api/training/gitbook-init`
- Check MongoDB for stored content
- Verify search query format

### Debug Endpoints
- **`/api/test-search`**: Test search functionality directly
- **Browser Console**: Check for API response errors
- **MongoDB Compass**: Direct database inspection

## 📖 Additional Documentation

- **`DEPLOYMENT_GUIDE.md`**: Complete deployment instructions
- **`MONGODB_INTEGRATION.md`**: Detailed MongoDB setup
- **`GITBOOK_INTEGRATION_README.md`**: GitBook integration details
- **`SECRET_TRAINING_README.md`**: Secret training system guide

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the MIT License.

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section above
2. Review the additional documentation files
3. Check browser console for error messages
4. Verify MongoDB connection and data
5. Test API endpoints directly

---

**Built with ❤️ for the Koasync community**
