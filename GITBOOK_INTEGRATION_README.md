# GitBook Integration for Koasync Bot

This document explains how the new GitBook integration system works and how to use it.

## Overview

The bot now stores GitBook documentation in MongoDB instead of hardcoded data, providing:
- **Natural, clear responses** - Short and clear when users don't want details
- **Guidance to visit X and GitBook** - When users ask for more detailed information
- **Updated Jupiter Integration info** - Clarifies that Jupiter integration is not live yet
- **Persistent storage** - All content is stored in MongoDB for easy updates

## Setup Instructions

### 1. Create Environment File

Create a `.env.local` file in your project root with:

```bash
# MongoDB Atlas Connection String
MONGODB_URI=

# OpenAI API Key (if needed)
# NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here

# Auto-training Secret Key (if needed)
# AUTO_TRAIN_SECRET=your_random_secret_key_here_32_characters_long
```

### 2. Initialize GitBook Content

After starting your development server, make a POST request to initialize the GitBook content:

```bash
curl -X POST http://localhost:3000/api/training/gitbook-init
```

This will populate the MongoDB database with all the GitBook content.

### 3. Test the Search

Test the search functionality:

```bash
curl -X POST http://localhost:3000/api/training/gitbook-search \
  -H "Content-Type: application/json" \
  -d '{"query": "Jupiter integration"}'
```

## How It Works

### Bot Response Style

The bot now provides:

1. **Short, clear answers** for basic questions
2. **Natural language responses** that feel conversational
3. **Guidance to visit GitBook/X** for detailed information
4. **Special handling for Jupiter Integration** - clarifies it's not live yet

### Example Responses

**User asks about Jupiter:**
```
Koa has always existed as an asynchronous observer—catching signals in sentiment, token mentions, and announcements. But insight alone wasn't enough. She needed to empower action.

Enter Jupiter.

Why Jupiter?
Jupiter delivers deep liquidity and trustworthy routing on Solana. By integrating Jupiter, Koa gains the power to transform observation into action.

IMPORTANT: Jupiter Integration is currently in development and will be available soon. Keep an eye on our Twitter page for updates once the integration goes live!

💡 Want to know more? Visit our GitBook for detailed documentation: https://koasync.gitbook.io/ or follow us on X: https://x.com/koasync
```

**User asks for general info:**
```
I found 3 relevant pieces of information. For even more detailed documentation, visit our GitBook: https://koasync.gitbook.io/
```

## Key Features

### 1. MongoDB Storage
- All GitBook content is stored in the `gitbook_content` collection
- Easy to update and maintain content
- Persistent across server restarts

### 2. Natural Language Processing
- Enhanced search with relevance scoring
- Natural, conversational responses
- Clear guidance for more information

### 3. Jupiter Integration Clarification
- Automatically clarifies that Jupiter integration is not live yet
- Provides guidance to check Twitter for updates
- Maintains transparency about feature status

### 4. User Guidance
- Always provides links to GitBook and X
- Encourages users to visit official sources for detailed info
- Maintains the bot's helpful, guiding personality

## API Endpoints

### `/api/training/gitbook-init`
- **Method**: POST
- **Purpose**: Initialize GitBook content in MongoDB
- **Response**: Success message with count of created items

### `/api/training/gitbook-search`
- **Method**: POST
- **Body**: `{"query": "search term"}`
- **Purpose**: Search GitBook content
- **Response**: Relevant content with natural language responses

## Content Structure

Each GitBook item contains:
- `title`: Section title
- `content`: Full content text
- `section`: Category/section name
- `url`: GitBook URL
- `order`: Display order
- `score`: Search relevance score
- `matchedKeywords`: Keywords that matched the search

## Updating Content

To update GitBook content:

1. Modify the data in `/api/training/gitbook-init/route.ts`
2. Delete existing content from MongoDB (if needed)
3. Call the init endpoint again
4. Or update individual items using the GitBookContent model methods

## Benefits

1. **Maintainable**: Easy to update content without code changes
2. **Scalable**: MongoDB can handle large amounts of content
3. **User-friendly**: Natural responses with clear guidance
4. **Transparent**: Honest about feature status (like Jupiter integration)
5. **Professional**: Always directs users to official sources

## Troubleshooting

### MongoDB Connection Issues
- Ensure `.env.local` file exists with correct `MONGODB_URI`
- Restart development server after creating environment file
- Check MongoDB connection logs

### Content Not Found
- Call `/api/training/gitbook-init` to populate database
- Check MongoDB for `gitbook_content` collection
- Verify content exists and is marked as active

### Search Not Working
- Check GitBookContent model imports
- Verify MongoDB connection is working
- Check server logs for errors

## Future Enhancements

1. **Admin Panel**: Web interface for content management
2. **Content Versioning**: Track changes and rollback capability
3. **Advanced Search**: Full-text search with Elasticsearch
4. **Content Analytics**: Track what users search for most
5. **Multi-language Support**: Support for different languages
