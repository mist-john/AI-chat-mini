import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import GitBookContent from '@/models/GitBookContent';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json({ success: false, error: 'Query is required' }, { status: 400 });
    }

    console.log(`[GitBook Search] Searching for: "${query}"`);

    // -----------------------------Enhanced search with multiple strategies-----------------------------//
    let searchResults = [];
    
    // Strategy 1: Try MongoDB text search first
    try {
      const textSearchResults = await GitBookContent.find(
        { $text: { $search: query } },
        { score: { $meta: "textScore" } }
      ).sort({ score: { $meta: "textScore" } }).limit(5);
      
      if (textSearchResults.length > 0) {
        console.log(`[GitBook Search] Text search found ${textSearchResults.length} results`);
        searchResults = textSearchResults;
      }
    } catch (error) {
      console.log('[GitBook Search] Text search failed, falling back to keyword search:', error instanceof Error ? error.message : 'Unknown error');
    }

    // Strategy 2: If text search fails or returns few results, use enhanced keyword matching
    if (searchResults.length < 3) {
      const keywords = query.toLowerCase().split(' ').filter((word: string) => word.length > 2);
      console.log(`[GitBook Search] Using keywords: ${keywords.join(', ')}`);
      
      // More flexible keyword matching
      const keywordResults = await GitBookContent.find({
        $or: [
          // Exact phrase match (highest priority)
          { content: { $regex: query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
          { title: { $regex: query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
          // Individual keyword matches
          { content: { $regex: keywords.join('|'), $options: 'i' } },
          { title: { $regex: keywords.join('|'), $options: 'i' } },
          { section: { $regex: keywords.join('|'), $options: 'i' } },
          // Partial word matches for better coverage
          ...keywords.map((keyword: string) => ({
            $or: [
              { content: { $regex: `\\b${keyword}`, $options: 'i' } },
              { title: { $regex: `\\b${keyword}`, $options: 'i' } },
              { section: { $regex: `\\b${keyword}`, $options: 'i' } }
            ]
          }))
        ]
      }).limit(8); // Increased limit for better coverage
      
      if (keywordResults.length > 0) {
        console.log(`[GitBook Search] Keyword search found ${keywordResults.length} results`);
        // Combine with existing results, avoiding duplicates
        const existingIds = searchResults.map(r => r._id.toString());
        const newResults = keywordResults.filter(r => !existingIds.includes(r._id.toString()));
        searchResults = [...searchResults, ...newResults];
      }
    }

    // Strategy 3: If still not enough results, try broader section-based search
    if (searchResults.length < 3) {
      console.log('[GitBook Search] Trying broader section-based search');
      
      // Look for content in related sections
      const sectionResults = await GitBookContent.find({
        $or: [
          { section: { $regex: query.split(' ')[0], $options: 'i' } },
          { title: { $regex: query.split(' ')[0], $options: 'i' } }
        ]
      }).limit(5);
      
      if (sectionResults.length > 0) {
        console.log(`[GitBook Search] Section search found ${sectionResults.length} results`);
        const existingIds = searchResults.map(r => r._id.toString());
        const newResults = sectionResults.filter(r => !existingIds.includes(r._id.toString()));
        searchResults = [...searchResults, ...newResults];
      }
    }

    // Strategy 4: If still no results, return general information about Koasync
    if (searchResults.length === 0) {
      console.log('[GitBook Search] No specific results found, returning general Koasync info');
      
      const generalInfo = await GitBookContent.find({
        $or: [
          { title: { $regex: 'Welcome|Introduction', $options: 'i' } },
          { section: { $regex: 'Introduction|Vision', $options: 'i' } }
        ]
      }).limit(2);
      
      searchResults = generalInfo;
    }

    // -----------------------------Format and prioritize results-----------------------------//
    const results = searchResults.slice(0, 8).map((content, index) => ({
      title: content.title,
      content: content.content.length > 500 ? content.content.substring(0, 500) + '...' : content.content,
      section: content.section,
      url: content.url,
      relevance: content.score || (10 - index), // Higher score for earlier results
      order: index + 1
    }));

    console.log(`[GitBook Search] Returning ${results.length} results for query: "${query}"`);
    console.log(`[GitBook Search] Results:`, results.map(r => `${r.order}. ${r.title} (${r.section})`));

    return NextResponse.json({
      success: true,
      results,
      count: results.length,
      query,
      searchStrategy: searchResults.length > 0 ? 'successful' : 'fallback',
      debug: {
        originalQuery: query,
        totalResultsFound: searchResults.length,
        finalResultsReturned: results.length
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
