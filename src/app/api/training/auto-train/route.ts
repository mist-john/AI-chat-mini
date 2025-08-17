import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import XPost from '@/models/XPost';

export async function POST(request: NextRequest) {
  try {
    // Check if this is an authorized request (you can add authentication here)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.AUTO_TRAIN_SECRET}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    // Sample X posts data for daily training
    const sampleXPosts = [
      {
        postId: `daily_${Date.now()}_1`,
        content: "🚀 Koasync daily update: Community is growing stronger every day! New features coming soon. #Koasync #AI #Solana",
        author: "koasync",
        timestamp: new Date(),
        likes: Math.floor(Math.random() * 100) + 50,
        retweets: Math.floor(Math.random() * 50) + 20,
        replies: Math.floor(Math.random() * 30) + 10,
        url: "https://x.com/koasync/status/daily",
        hashtags: ["koasync", "ai", "solana", "daily"],
        mentions: [],
        isRetweet: false,
        isReply: false
      },
      {
        postId: `daily_${Date.now()}_2`,
        content: "💎 Token utility update: New monitoring features are live! Track your favorite projects with enhanced precision. #Web3 #Monitoring",
        author: "koasync",
        timestamp: new Date(),
        likes: Math.floor(Math.random() * 80) + 40,
        retweets: Math.floor(Math.random() * 40) + 15,
        replies: Math.floor(Math.random() * 25) + 8,
        url: "https://x.com/koasync/status/daily2",
        hashtags: ["web3", "monitoring", "token", "utility"],
        mentions: [],
        isRetweet: false,
        isReply: false
      },
      {
        postId: `daily_${Date.now()}_3`,
        content: "🌟 AI companionship is evolving! Koa learns from every interaction. The future of intimate AI experiences is here. #AICompanion #Future",
        author: "koasync",
        timestamp: new Date(),
        likes: Math.floor(Math.random() * 120) + 60,
        retweets: Math.floor(Math.random() * 60) + 25,
        replies: Math.floor(Math.random() * 35) + 12,
        url: "https://x.com/koasync/status/daily3",
        hashtags: ["aicompanion", "future", "koasync", "evolution"],
        mentions: [],
        isRetweet: false,
        isReply: false
      }
    ];

    // Clear old daily posts and insert new ones
    await XPost.deleteMany({ postId: { $regex: /^daily_/ } });
    const insertedPosts = await XPost.insertMany(sampleXPosts);

    // Log training completion
    console.log(`[${new Date().toISOString()}] Automatic daily training completed with ${insertedPosts.length} new posts`);

    return NextResponse.json({
      success: true,
      message: `Automatic daily training completed successfully`,
      timestamp: new Date().toISOString(),
      count: insertedPosts.length,
      posts: insertedPosts.map(post => ({
        id: post._id,
        content: post.content,
        timestamp: post.timestamp,
        hashtags: post.hashtags
      }))
    });

  } catch (error) {
    console.error('Automatic training error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to complete automatic training' },
      { status: 500 }
    );
  }
}

// GET endpoint to check training status
export async function GET() {
  try {
    await connectToDatabase();
    
    const totalPosts = await XPost.countDocuments();
    const dailyPosts = await XPost.countDocuments({ postId: { $regex: /^daily_/ } });
    const lastTraining = await XPost.findOne({ postId: { $regex: /^daily_/ } }).sort({ timestamp: -1 });

    return NextResponse.json({
      success: true,
      status: {
        totalPosts,
        dailyPosts,
        lastTraining: lastTraining ? lastTraining.timestamp : null,
        isUpToDate: dailyPosts > 0 && lastTraining && 
          (new Date().getTime() - lastTraining.timestamp.getTime()) < 24 * 60 * 60 * 1000 // Within 24 hours
      }
    });

  } catch (error) {
    console.error('Training status check error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check training status' },
      { status: 500 }
    );
  }
}
