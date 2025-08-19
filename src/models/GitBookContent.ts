import { ObjectId } from 'mongodb';

export interface IGitBookContent {
  _id?: ObjectId;
  title: string;
  content: string;
  section: string;
  url: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  score?: number;
  matchedKeywords?: string[];
  // New fields for training data
  metadata?: {
    userQuestion?: string;
    aiAnalysis?: any;
    trainingType?: string;
    keywords?: string[];
    intent?: string;
    complexity?: string;
    sessionId?: string;
    timestamp?: string;
  };
  keywords?: string[];
}

export interface IGitBookContentCreate {
  title: string;
  content: string;
  section: string;
  url: string;
  order: number;
  metadata?: {
    userQuestion?: string;
    aiAnalysis?: any;
    trainingType?: string;
    keywords?: string[];
    intent?: string;
    complexity?: string;
    sessionId?: string;
    timestamp?: string;
  };
  keywords?: string[];
}

export class GitBookContent {
  static readonly COLLECTION_NAME = 'gitbook_content';

  static async create(contentData: IGitBookContentCreate): Promise<IGitBookContent> {
    const { getCollection } = await import('../lib/mongodb');
    const collection = await getCollection(this.COLLECTION_NAME);

    const now = new Date();
    const content: IGitBookContent = {
      ...contentData,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    const result = await collection.insertOne(content);
    return { ...content, _id: result.insertedId };
  }

  static async bulkCreate(contentArray: IGitBookContentCreate[]): Promise<IGitBookContent[]> {
    try {
    //   console.log(`[GitBookContent] Attempting to create ${contentArray.length} items in MongoDB`);
      const { getCollection } = await import('../lib/mongodb');
      const collection = await getCollection(this.COLLECTION_NAME);
      
    //   console.log(`[GitBookContent] Connected to collection: ${this.COLLECTION_NAME}`);

      const now = new Date();
      const contents = contentArray.map(content => ({
        ...content,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      }));

      const result = await collection.insertMany(contents);
    //   console.log(`[GitBookContent] Successfully created ${result.insertedCount} items`);
      
      return contents.map((content, index) => ({
        ...content,
        _id: result.insertedIds[index]
      }));
    } catch (error) {
      console.error('[GitBookContent] Error in bulkCreate:', error);
      throw error;
    }
  }

  static async search(query: string): Promise<IGitBookContent[]> {
    try {
    //   console.log(`[GitBookContent] Searching for: "${query}"`);
      const { getCollection } = await import('../lib/mongodb');
      const collection = await getCollection(this.COLLECTION_NAME);
      
    //   console.log(`[GitBookContent] Connected to collection: ${this.COLLECTION_NAME}`);

      // Simple text search for now - can be enhanced with proper text indexing
      const searchQuery = query.toLowerCase().trim();
      
      const allContent = await collection.find({ isActive: true }).toArray() as IGitBookContent[];
    //   console.log(`[GitBookContent] Found ${allContent.length} items in database`);
      
      // Enhanced search with relevance scoring
      const searchResults = allContent.map((item) => {
      const searchText = `${item.title} ${item.content} ${item.section}`.toLowerCase();
      const contentText = item.content.toLowerCase();
      const titleText = item.title.toLowerCase();
      const sectionText = item.section.toLowerCase();
      
      let score = 0;
      let matchedKeywords: string[] = [];
      
      // Exact phrase matching (highest priority)
      if (searchText.includes(searchQuery)) {
        score += 100;
        matchedKeywords.push('exact_phrase');
      }
      
      // Title matching (high priority)
      if (titleText.includes(searchQuery)) {
        score += 50;
        matchedKeywords.push('title_match');
      }
      
      // Content matching (high priority - this is what you wanted!)
      if (contentText.includes(searchQuery)) {
        score += 45;
        matchedKeywords.push('content_match');
      }
      
      // Partial word matching in content (medium priority)
      const searchWords = searchQuery.split(' ').filter(word => word.length > 2);
      let contentWordMatches = 0;
      searchWords.forEach(word => {
        if (contentText.includes(word)) {
          contentWordMatches++;
        }
      });
      if (contentWordMatches > 0) {
        score += contentWordMatches * 10;
        matchedKeywords.push(`content_words_${contentWordMatches}`);
      }
      
      // Section relevance
      if (sectionText.includes(searchQuery)) {
        score += 20;
        matchedKeywords.push('section_match');
      }
      
      // Training data bonus (user-provided knowledge)
      if (item.metadata?.trainingType === 'user_provided') {
        score += 30;
        matchedKeywords.push('training_data');
        
        // Extra bonus for training data content matches
        if (contentText.includes(searchQuery)) {
          score += 20;
          matchedKeywords.push('training_content_match');
        }
      }
      
      // Keyword matching from training data
      if (item.keywords && item.keywords.length > 0) {
        const keywordMatches = item.keywords.filter(keyword => 
          keyword.toLowerCase().includes(searchQuery)
        );
        if (keywordMatches.length > 0) {
          score += keywordMatches.length * 15;
          matchedKeywords.push(...keywordMatches);
        }
      }
      
      // Intent matching from training data
      if (item.metadata?.intent && item.metadata.intent.toLowerCase().includes(searchQuery)) {
        score += 25;
        matchedKeywords.push('intent_match');
      }
      
      // Content quality scoring
      if (item.content.length > 200) {
        score += 5;
      }
      
      // Bonus for detailed content that matches search
      if (contentText.includes(searchQuery) && item.content.length > 100) {
        score += 15;
        matchedKeywords.push('detailed_content');
      }
      
      // Bonus for content that contains multiple search terms
      const searchTerms = searchQuery.split(' ').filter(term => term.length > 2);
      const contentTermMatches = searchTerms.filter(term => contentText.includes(term)).length;
      if (contentTermMatches > 1) {
        score += contentTermMatches * 8;
        matchedKeywords.push(`multi_term_match_${contentTermMatches}`);
      }
      
      // Partial word matching for similar terms
      const partialMatches = searchTerms.filter(term => {
        return contentText.split(' ').some(contentWord => {
          if (contentWord.length < 3) return false;
          return contentWord.includes(term) || term.includes(contentWord);
        });
      });
      if (partialMatches.length > 0) {
        score += partialMatches.length * 5;
        matchedKeywords.push(`partial_match_${partialMatches.length}`);
      }
      
      // Context relevance - check if surrounding content is relevant
      if (contentText.includes(searchQuery)) {
        const contextWords = contentText.split(' ').slice(-20, 20); // Check surrounding context
        const contextRelevance = searchTerms.filter(term => 
          contextWords.some(word => word.includes(term))
        ).length;
        if (contextRelevance > 0) {
          score += contextRelevance * 3;
          matchedKeywords.push(`context_relevance_${contextRelevance}`);
        }
      }
      
      return {
        ...item,
        score,
        matchedKeywords,
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => (b.score || 0) - (a.score || 0));

    // console.log(`[GitBookContent] Returning ${searchResults.length} search results`);
    return searchResults.slice(0, 8);
  } catch (error) {
    console.error('[GitBookContent] Error in search:', error);
    throw error;
  }
}

  static async getAll(): Promise<IGitBookContent[]> {
    try {
    //   console.log(`[GitBookContent] Getting all content from collection: ${this.COLLECTION_NAME}`);
      const { getCollection } = await import('../lib/mongodb');
      const collection = await getCollection(this.COLLECTION_NAME);

      const allContent = await collection.find({ isActive: true }).sort({ order: 1 }).toArray() as IGitBookContent[];
    //   console.log(`[GitBookContent] Found ${allContent.length} items in database`);
      
      return allContent;
    } catch (error) {
      console.error('[GitBookContent] Error in getAll:', error);
      throw error;
    }
  }

  static async update(id: string, updateData: Partial<IGitBookContent>): Promise<boolean> {
    const { getCollection } = await import('../lib/mongodb');
    const collection = await getCollection(this.COLLECTION_NAME);

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          ...updateData, 
          updatedAt: new Date() 
        } 
      }
    );

    return result.modifiedCount > 0;
  }

  static async delete(id: string): Promise<boolean> {
    const { getCollection } = await import('../lib/mongodb');
    const collection = await getCollection(this.COLLECTION_NAME);

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { isActive: false, updatedAt: new Date() } }
    );

    return result.modifiedCount > 0;
  }
}
