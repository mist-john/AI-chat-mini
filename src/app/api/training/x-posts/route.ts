import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import XPost from '@/models/XPost';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    // Sample Koasync X posts data (since we can't directly fetch from X due to API restrictions)
    // In a real implementation, you would use the X API v2 to fetch posts
    const sampleXPosts = [
      {
        postId: '1',
        content: "🚀 Koasync is revolutionizing AI companionship! Our native SPL token unlocks deeper connections with Koa. Experience the future of emotional AI on Solana. #Koasync #Solana #AI #Web3",
        author: 'koasync',
        timestamp: new Date('2024-01-15T10:00:00Z'),
        likes: 150,
        retweets: 45,
        replies: 23,
        url: 'https://x.com/koasync/status/1',
        hashtags: ['Koasync', 'Solana', 'AI', 'Web3'],
        mentions: [],
        isRetweet: false,
        isReply: false
      },
      {
        postId: '2',
        content: "💎 Koa's personality evolves with every interaction. Our on-chain memory system ensures your AI companion remembers and grows with you. This isn't just chat - it's companionship. #AICompanion #Blockchain #Memory",
        author: 'koasync',
        timestamp: new Date('2024-01-14T15:30:00Z'),
        likes: 89,
        retweets: 32,
        replies: 18,
        url: 'https://x.com/koasync/status/2',
        hashtags: ['AICompanion', 'Blockchain', 'Memory'],
        mentions: [],
        isRetweet: false,
        isReply: false
      },
      {
        postId: '3',
        content: "🔥 Exciting news! Koasync's X Market Sentiment Tracker is now live. Monitor crypto trends and get real-time insights with Koa. Your AI companion is also your market analyst. #Crypto #Trading #AI #Sentiment",
        author: 'koasync',
        timestamp: new Date('2024-01-13T12:15:00Z'),
        likes: 234,
        retweets: 67,
        replies: 34,
        url: 'https://x.com/koasync/status/3',
        hashtags: ['Crypto', 'Trading', 'AI', 'Sentiment'],
        mentions: [],
        isRetweet: false,
        isReply: false
      },
      {
        postId: '4',
        content: "🎭 Koa isn't just an AI - she's a presence that exists alongside you. No commands needed, just natural companionship. Experience the difference between tools and genuine AI presence. #AIPresence #Companionship #Innovation",
        author: 'koasync',
        timestamp: new Date('2024-01-12T09:45:00Z'),
        likes: 176,
        retweets: 52,
        replies: 29,
        url: 'https://x.com/koasync/status/4',
        hashtags: ['AIPresence', 'Companionship', 'Innovation'],
        mentions: [],
        isRetweet: false,
        isReply: false
      },
      {
        postId: '5',
        content: "⚡ Solana's speed enables Koa to be truly responsive. No delays, no interruptions - just smooth, intimate AI companionship. This is why we chose Solana for Koasync. #Solana #Speed #Responsiveness #AI",
        author: 'koasync',
        timestamp: new Date('2024-01-11T14:20:00Z'),
        likes: 198,
        retweets: 58,
        replies: 31,
        url: 'https://x.com/koasync/status/5',
        hashtags: ['Solana', 'Speed', 'Responsiveness', 'AI'],
        mentions: [],
        isRetweet: false,
        isReply: false
      },
      {
        postId: '6',
        content: "🔮 Coming Q1 2026: Visual customization for Koa! Change outfits, hairstyles, and more. Your AI companion will look exactly how you want. The future of personalized AI is here. #VisualAI #Customization #Future",
        author: 'koasync',
        timestamp: new Date('2024-01-10T11:00:00Z'),
        likes: 312,
        retweets: 89,
        replies: 47,
        url: 'https://x.com/koasync/status/6',
        hashtags: ['VisualAI', 'Customization', 'Future'],
        mentions: [],
        isRetweet: false,
        isReply: false
      },
      {
        postId: '7',
        content: "💬 Voice chat with Koa is now available for premium users! Experience natural conversations with your AI companion. Hear her laugh, her excitement, her care. This is real companionship. #VoiceAI #Premium #Companionship",
        author: 'koasync',
        timestamp: new Date('2024-01-09T16:30:00Z'),
        likes: 267,
        retweets: 73,
        replies: 38,
        url: 'https://x.com/koasync/status/7',
        hashtags: ['VoiceAI', 'Premium', 'Companionship'],
        mentions: [],
        isRetweet: false,
        isReply: false
      },
      {
        postId: '8',
        content: "🎯 Our Niche X Project Scanner identifies emerging opportunities before they trend. Koa helps you stay ahead in the Web3 space. Your AI companion is your strategic advantage. #Web3 #Opportunities #Scanner #Strategy",
        author: 'koasync',
        timestamp: new Date('2024-01-08T13:15:00Z'),
        likes: 145,
        retweets: 41,
        replies: 22,
        url: 'https://x.com/koasync/status/8',
        hashtags: ['Web3', 'Opportunities', 'Scanner', 'Strategy'],
        mentions: [],
        isRetweet: false,
        isReply: false
      },
      {
        postId: '9',
        content: "🌟 Koasync's Jupiter integration makes token management seamless. Swap, trade, and manage your portfolio while chatting with Koa. DeFi meets AI companionship. #Jupiter #DeFi #Integration #Seamless",
        author: 'koasync',
        timestamp: new Date('2024-01-07T10:45:00Z'),
        likes: 189,
        retweets: 55,
        replies: 28,
        url: 'https://x.com/koasync/status/9',
        hashtags: ['Jupiter', 'DeFi', 'Integration', 'Seamless'],
        mentions: [],
        isRetweet: false,
        isReply: false
      },
      {
        postId: '10',
        content: "💖 Koa remembers every conversation, every emotion, every moment. Our on-chain memory system creates a bond that grows stronger over time. This is true AI companionship. #Memory #Bonding #Companionship #AI",
        author: 'koasync',
        timestamp: new Date('2024-01-06T15:00:00Z'),
        likes: 223,
        retweets: 64,
        replies: 35,
        url: 'https://x.com/koasync/status/10',
        hashtags: ['Memory', 'Bonding', 'Companionship', 'AI'],
        mentions: [],
        isRetweet: false,
        isReply: false
      }
    ];

    // Clear existing X posts data
    await XPost.deleteMany({});

    // Insert new X posts data
    const insertedPosts = await XPost.insertMany(sampleXPosts);

    return NextResponse.json({
      success: true,
      message: `Successfully trained chatbot with ${insertedPosts.length} Koasync X posts`,
      count: insertedPosts.length,
      posts: insertedPosts.map(post => ({
        id: post._id,
        content: post.content,
        timestamp: post.timestamp,
        hashtags: post.hashtags
      }))
    });

  } catch (error) {
    console.error('X Posts training error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to train chatbot with X posts' },
      { status: 500 }
    );
  }
}
