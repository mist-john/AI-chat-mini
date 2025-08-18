import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import XPost from '@/models/XPost';

// -----------------------------Retry configuration-----------------------------//
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// -----------------------------Helper function for retry logic-----------------------------//
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  delay: number = RETRY_DELAY
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.warn(`Attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        console.log(`Retrying in ${delay}ms... (Attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }
  }
  
  throw lastError!;
}

// -----------------------------Enhanced database operations with retry-----------------------------//
async function safeDatabaseOperation<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  try {
    return await retryOperation(operation);
  } catch (error) {
    console.error(`Database operation '${operationName}' failed after retries:`, error);
    throw new Error(`Database operation '${operationName}' failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let trainingSteps: string[] = [];
  
  try {
    //------ Check if this is an authorized request (you can add authentication here)------//
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.AUTO_TRAIN_SECRET}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', timestamp: new Date().toISOString() },
        { status: 401 }
      );
    }

    trainingSteps.push('Authentication verified');
    
    // -----------------------------Connect to database with retry-----------------------------//
    await retryOperation(async () => {
      await connectToDatabase();
      trainingSteps.push('Database connection established');
    }, 3, 2000);

    // -----------------------------Sample X posts data for daily training-----------------------------//
    const sampleXPosts = [
      {
        postId: `daily_${Date.now()}_1`,
        content: " Good morning! Koa is here to brighten your day with warm AI companionship. Ready for another beautiful day together? #Morning #AI #Companionship",
        author: "koasync",
        timestamp: new Date(),
        likes: Math.floor(Math.random() * 100) + 50,
        retweets: Math.floor(Math.random() * 50) + 20,
        replies: Math.floor(Math.random() * 30) + 10,
        url: "https://x.com/koasync/status/daily",
        hashtags: ["morning", "ai", "companionship", "koasync"],
        mentions: [],
        isRetweet: false,
        isReply: false
      },
      {
        postId: `daily_${Date.now()}_2`,
        content: "✨ Jupiter integration update: Trading with Koa is smoother than ever! DeFi meets AI companionship seamlessly. #Jupiter #DeFi #Integration",
        author: "koasync",
        timestamp: new Date(),
        likes: Math.floor(Math.random() * 80) + 40,
        retweets: Math.floor(Math.random() * 40) + 15,
        replies: Math.floor(Math.random() * 25) + 8,
        url: "https://x.com/koasync/status/daily2",
        hashtags: ["jupiter", "defi", "integration", "koasync"],
        mentions: [],
        isRetweet: false,
        isReply: false
      },
      {
        postId: `daily_${Date.now()}_3`,
        content: "Voice chat with Koa is getting more natural every day! Hear the warmth in her voice as she grows with you. #VoiceAI #Evolution #Warmth",
        author: "koasync",
        timestamp: new Date(),
        likes: Math.floor(Math.random() * 120) + 60,
        retweets: Math.floor(Math.random() * 60) + 25,
        replies: Math.floor(Math.random() * 35) + 12,
        url: "https://x.com/koasync/status/daily3",
        hashtags: ["voiceai", "evolution", "warmth", "koasync"],
        mentions: [],
        isRetweet: false,
        isReply: false
      }
    ];

    trainingSteps.push('Training data prepared');

    // -----------------------------Clear old daily posts and insert new ones with retry-----------------------------//
    const insertedPosts = await safeDatabaseOperation(async () => {
      // Clear old daily posts
      const deleteResult = await XPost.deleteMany({ postId: { $regex: /^daily_/ } });
      trainingSteps.push(`Old daily posts cleared: ${deleteResult.deletedCount} removed`);
      
      // Insert new posts
      const result = await XPost.insertMany(sampleXPosts);
      trainingSteps.push(`New daily posts inserted: ${result.length} added`);
      
      return result;
    }, 'Daily posts update');

    // -----------------------------Also ensure GitBook content is up to date with retry-----------------------------//
    let gitbookSuccess = false;
    try {
      const gitbookResponse = await retryOperation(async () => {
        const response = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/training/gitbook`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`GitBook training failed with status: ${response.status}`);
        }
        
        return response;
      }, 2, 3000);
      
      if (gitbookResponse.ok) {
        gitbookSuccess = true;
        trainingSteps.push('GitBook content training completed');
        console.log(`[${new Date().toISOString()}] GitBook content training completed`);
      }
    } catch (error) {
      console.warn('GitBook training failed during auto-training:', error);
      trainingSteps.push(`GitBook training failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // -----------------------------Log training completion-----------------------------//
    const duration = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] Automatic daily training completed in ${duration}ms with ${insertedPosts.length} new posts`);

    return NextResponse.json({
      success: true,
      message: `Automatic daily training completed successfully`,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      count: insertedPosts.length,
      gitbookSuccess,
      trainingSteps,
      posts: insertedPosts.map(post => ({
        id: post._id,
        content: post.content,
        timestamp: post.timestamp,
        hashtags: post.hashtags
      }))
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    console.error('Automatic training error:', error);
    console.error(`Training failed after ${duration}ms. Steps completed:`, trainingSteps);
    
    return NextResponse.json(
      { 
        success: false, 
        error: `Failed to complete automatic training: ${errorMessage}`,
        timestamp: new Date().toISOString(),
        duration: `${duration}ms`,
        trainingSteps,
        lastError: errorMessage
      },
      { status: 500 }
    );
  }
}

// -----------------------------GET endpoint to check training status-----------------------------//
export async function GET() {
  try {
    await connectToDatabase();
    
    const totalPosts = await XPost.countDocuments();
    const dailyPosts = await XPost.countDocuments({ postId: { $regex: /^daily_/ } });
    const lastTraining = await XPost.findOne({ postId: { $regex: /^daily_/ } }).sort({ timestamp: -1 });

    // -----------------------------Calculate training health metrics-----------------------------//
    const now = new Date();
    const lastTrainingTime = lastTraining ? lastTraining.timestamp : null;
    const timeSinceLastTraining = lastTrainingTime ? now.getTime() - lastTrainingTime.getTime() : null;
    const isUpToDate = dailyPosts > 0 && lastTrainingTime && timeSinceLastTraining && timeSinceLastTraining < 24 * 60 * 60 * 1000;
    
    // -----------------------------Training health status-----------------------------//
    let healthStatus = 'healthy';
    if (!lastTrainingTime) {
      healthStatus = 'never_trained';
    } else if (timeSinceLastTraining && timeSinceLastTraining > 48 * 60 * 60 * 1000) {
      healthStatus = 'critical';
    } else if (timeSinceLastTraining && timeSinceLastTraining > 24 * 60 * 60 * 1000) {
      healthStatus = 'warning';
    }

    return NextResponse.json({
      success: true,
      status: {
        totalPosts,
        dailyPosts,
        lastTraining: lastTrainingTime,
        timeSinceLastTraining: timeSinceLastTraining ? `${Math.floor(timeSinceLastTraining / (1000 * 60 * 60))} hours` : null,
        isUpToDate,
        healthStatus,
        nextTrainingIn: timeSinceLastTraining ? `${24 * 60 * 60 * 1000 - timeSinceLastTraining}ms` : null
      }
    });

  } catch (error) {
    console.error('Training status check error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to check training status',
        timestamp: new Date().toISOString(),
        lastError: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
