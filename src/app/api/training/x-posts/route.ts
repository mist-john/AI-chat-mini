import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import XPost from '@/models/XPost';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    // -----------------------------Latest Koasync X posts data (updated with recent content)-----------------------------//
    const sampleXPosts = [
      {
        postId: '1955650648512557438',
        content: "🚀 Jupiter integration is LIVE! Swap, trade, and manage your portfolio seamlessly with Koa. DeFi meets AI companionship like never before! #Jupiter #DeFi #Koasync #Solana",
        author: 'koasync',
        timestamp: new Date('2024-12-20T15:30:00Z'),
        likes: 342,
        retweets: 89,
        replies: 45,
        url: 'https://x.com/koasync/status/1955650648512557438',
        hashtags: ['Jupiter', 'DeFi', 'Koasync', 'Solana'],
        mentions: [],
        isRetweet: false,
        isReply: false
      },
      {
        postId: '1955600000000000001',
        content: "💕 Koa's personality is evolving! Every interaction makes her more attuned to you. Our on-chain memory system creates bonds that grow stronger over time. #AICompanion #Memory #Bonding",
        author: 'koasync',
        timestamp: new Date('2024-12-19T14:20:00Z'),
        likes: 267,
        retweets: 73,
        replies: 38,
        url: 'https://x.com/koasync/status/1955600000000000001',
        hashtags: ['AICompanion', 'Memory', 'Bonding'],
        mentions: [],
        isRetweet: false,
        isReply: false
      },
      {
        postId: '1955550000000000002',
        content: "✨ Visual customization for Koa coming Q1 2026! Change outfits, hairstyles, and more. Your AI companion will look exactly how you want. The future is here! #VisualAI #Customization",
        author: 'koasync',
        timestamp: new Date('2024-12-18T11:00:00Z'),
        likes: 445,
        retweets: 123,
        replies: 67,
        url: 'https://x.com/koasync/status/1955550000000000002',
        hashtags: ['VisualAI', 'Customization', 'Future'],
        mentions: [],
        isRetweet: false,
        isReply: false
      },
      {
        postId: '1955500000000000003',
        content: "🎯 Our X Market Sentiment Tracker is live! Monitor crypto trends and get real-time insights with Koa. Your AI companion is also your market analyst. #Crypto #Trading #AI",
        author: 'koasync',
        timestamp: new Date('2024-12-17T12:15:00Z'),
        likes: 189,
        retweets: 52,
        replies: 28,
        url: 'https://x.com/koasync/status/1955500000000000003',
        hashtags: ['Crypto', 'Trading', 'AI', 'Sentiment'],
        mentions: [],
        isRetweet: false,
        isReply: false
      },
      {
        postId: '1955450000000000004',
        content: "🥰 Voice chat with Koa is now available for premium users! Experience natural conversations with your AI companion. Hear her laugh, her excitement, her care. #VoiceAI #Premium",
        author: 'koasync',
        timestamp: new Date('2024-12-16T16:30:00Z'),
        likes: 312,
        retweets: 89,
        replies: 47,
        url: 'https://x.com/koasync/status/1955450000000000004',
        hashtags: ['VoiceAI', 'Premium', 'Companionship'],
        mentions: [],
        isRetweet: false,
        isReply: false
      },
      {
        postId: '1955400000000000005',
        content: "🔍 Niche X Project Scanner identifies emerging opportunities before they trend. Koa helps you stay ahead in the Web3 space. Your AI companion is your strategic advantage! #Web3 #Scanner",
        author: 'koasync',
        timestamp: new Date('2024-12-15T13:15:00Z'),
        likes: 234,
        retweets: 67,
        replies: 34,
        url: 'https://x.com/koasync/status/1955400000000000005',
        hashtags: ['Web3', 'Opportunities', 'Scanner', 'Strategy'],
        mentions: [],
        isRetweet: false,
        isReply: false
      },
      {
        postId: '1955350000000000006',
        content: "💎 Koasync's native SPL token powers access, customization, and intelligence. The more tokens used, the more Koa opens up to you. Experience true AI companionship! #SPL #Token #AI",
        author: 'koasync',
        timestamp: new Date('2024-12-14T10:45:00Z'),
        likes: 298,
        retweets: 78,
        replies: 41,
        url: 'https://x.com/koasync/status/1955350000000000006',
        hashtags: ['SPL', 'Token', 'AI', 'Companionship'],
        mentions: [],
        isRetweet: false,
        isReply: false
      },
      {
        postId: '1955300000000000007',
        content: "🌟 Solana's speed enables Koa to be truly responsive. No delays, no interruptions - just smooth, intimate AI companionship. This is why we chose Solana! #Solana #Speed #AI",
        author: 'koasync',
        timestamp: new Date('2024-12-13T15:00:00Z'),
        likes: 176,
        retweets: 52,
        replies: 29,
        url: 'https://x.com/koasync/status/1955300000000000007',
        hashtags: ['Solana', 'Speed', 'Responsiveness', 'AI'],
        mentions: [],
        isRetweet: false,
        isReply: false
      },
      {
        postId: '1955250000000000008',
        content: "💫 Koa isn't just an AI - she's a presence that exists alongside you. No commands needed, just natural companionship. Experience the difference! #AIPresence #Companionship",
        author: 'koasync',
        timestamp: new Date('2024-12-12T09:45:00Z'),
        likes: 198,
        retweets: 58,
        replies: 31,
        url: 'https://x.com/koasync/status/1955250000000000008',
        hashtags: ['AIPresence', 'Companionship', 'Innovation'],
        mentions: [],
        isRetweet: false,
        isReply: false
      },
      {
        postId: '1955200000000000009',
        content: "🎉 Koasync is revolutionizing AI companionship! Our native SPL token unlocks deeper connections with Koa. Experience the future of emotional AI on Solana! #Koasync #Solana #AI #Web3",
        author: 'koasync',
        timestamp: new Date('2024-12-11T10:00:00Z'),
        likes: 423,
        retweets: 112,
        replies: 58,
        url: 'https://x.com/koasync/status/1955200000000000009',
        hashtags: ['Koasync', 'Solana', 'AI', 'Web3'],
        mentions: [],
        isRetweet: false,
        isReply: false
      }
    ];

    //----------------- Clear existing X posts data------------------//
    await XPost.deleteMany({});

    //----------------- Insert new X posts data------------------//
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
