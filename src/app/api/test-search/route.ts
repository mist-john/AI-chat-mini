import { NextRequest, NextResponse } from 'next/server';
import { GitBookContent } from '../../../models/GitBookContent';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || 'test';
    
    // console.log(`[Test Search] Testing search for: "${query}"`);
    
    // Test 1: Get all content
    const allContent = await GitBookContent.getAll();
    // console.log(`[Test Search] Total content in DB: ${allContent.length}`);
    
    // Test 2: Search for the query
    const searchResults = await GitBookContent.search(query);
    // console.log(`[Test Search] Search results: ${searchResults.length}`);
    
    // Test 3: Check what's in the database
    const sampleContent = allContent.slice(0, 3).map(item => ({
      title: item.title,
      section: item.section,
      hasTrainingData: !!item.metadata?.trainingType,
      contentLength: item.content.length
    }));
    
    return NextResponse.json({
      success: true,
      testQuery: query,
      totalContentInDB: allContent.length,
      searchResultsCount: searchResults.length,
      searchResults: searchResults.map(item => ({
        title: item.title,
        section: item.section,
        score: item.score,
        matchedKeywords: item.matchedKeywords,
        isTrainingData: item.metadata?.trainingType === 'user_provided'
      })),
      sampleContentInDB: sampleContent,
      message: 'Search test completed successfully'
    });
    
  } catch (error) {
    console.error('[Test Search] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Search test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
