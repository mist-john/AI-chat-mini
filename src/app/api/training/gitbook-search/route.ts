import { NextRequest, NextResponse } from 'next/server';
import { GitBookContent } from '../../../../models/GitBookContent';

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json({ 
        success: false, 
        error: 'Query is required' 
      }, { status: 400 });
    }

    // console.log(`[GitBook Search] Searching for: "${query}"`);
    
    // Search GitBook content including training data
    const searchResults = await GitBookContent.search(query);
    
    if (searchResults.length === 0) {
      return NextResponse.json({
        success: true,
        message: "I don't have specific information about that yet. You can visit our GitBook for comprehensive documentation or ask me to train on this topic!",
        data: [],
        links: {
          gitbook: "https://koasync.gitbook.io/",
          twitter: "https://x.com/koasync"
        }
      });
    }

    // Check if we have training data in results
    const trainingData = searchResults.filter(item => 
      item.metadata?.trainingType === 'user_provided'
    );
    
    const officialContent = searchResults.filter(item => 
      item.metadata?.trainingType !== 'user_provided'
    );

    // Build response based on what we found
    let responseMessage = "";
    let responseData = searchResults;

    if (trainingData.length > 0 && officialContent.length > 0) {
      // We have both training data and official content
      responseMessage = `I found both official documentation and user training data about "${query}". Here's what I know:`;
      
      // Prioritize training data for user questions
      if (trainingData.some(item => item.metadata?.intent === 'question')) {
        responseMessage += `\n\n**Based on user training:** ${trainingData[0].content}`;
        responseMessage += `\n\n**Official documentation:** ${officialContent[0].content.substring(0, 200)}...`;
      } else {
        responseMessage += `\n\n**Official documentation:** ${officialContent[0].content.substring(0, 200)}...`;
        responseMessage += `\n\n**Additional insights from training:** ${trainingData[0].content}`;
      }
    } else if (trainingData.length > 0) {
      // Only training data available
      responseMessage = `Based on user training data, here's what I know about "${query}":\n\n${trainingData[0].content}`;
      responseMessage += `\n\n*This information comes from user training. For official documentation, visit our GitBook.*`;
    } else {
      // Only official content available
      responseMessage = `Here's what I found about "${query}":\n\n${officialContent[0].content.substring(0, 300)}...`;
    }

    // Add Jupiter integration special handling
    if (query.toLowerCase().includes('jupiter') || query.toLowerCase().includes('swap')) {
      responseMessage += `\n\n⚠️ **Important Note:** Jupiter Integration is not live yet, but it's planned! The utility is coming soon. Keep an eye on our Twitter page for updates on its launch!`;
    }

    // Always add links for more information
    responseMessage += `\n\n📚 **For more detailed information:**\n- GitBook: https://koasync.gitbook.io/\n- Twitter: https://x.com/koasync`;

    return NextResponse.json({
      success: true,
      message: responseMessage,
      data: responseData,
      hasTrainingData: trainingData.length > 0,
      trainingDataCount: trainingData.length,
      officialContentCount: officialContent.length,
      links: {
        gitbook: "https://koasync.gitbook.io/",
        twitter: "https://x.com/koasync"
      }
    });

  } catch (error) {
    console.error('[GitBook Search] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to search GitBook content',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 
