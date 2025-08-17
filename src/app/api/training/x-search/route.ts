import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import XPost from '@/models/XPost';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Query is required' },
        { status: 400 }
      );
    }

    // -----------------------------Search for relevant X posts using text search-----------------------------//
    const searchResults = await XPost.find(
      { $text: { $search: query } },
      { score: { $meta: 'textScore' } }
    )
    .sort({ score: { $meta: 'textScore' } })
    .limit(3);

    // -----------------------------If no text search results, try keyword matching-----------------------------//
    let results = searchResults;
    if (results.length === 0) {
      const keywords = query.toLowerCase().split(' ');
      const keywordResults = await XPost.find({
        $or: [
          { content: { $regex: keywords.join('|'), $options: 'i' } },
          { hashtags: { $in: keywords.map((k: string) => new RegExp(k, 'i')) } },
          { author: { $regex: keywords.join('|'), $options: 'i' } }
        ]
      }).limit(3);
      results = keywordResults;
    }

    // -----------------------------Format results for the AI-----------------------------//
    const formattedResults = results.map(item => ({
      content: item.content,
      timestamp: item.timestamp,
      hashtags: item.hashtags,
      url: item.url,
      engagement: {
        likes: item.likes,
        retweets: item.retweets,
        replies: item.replies
      }
    }));

    return NextResponse.json({
      success: true,
      results: formattedResults,
      count: formattedResults.length
    });

  } catch (error) {
    console.error('X posts search error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to search X posts' },
      { status: 500 }
    );
  }
}
