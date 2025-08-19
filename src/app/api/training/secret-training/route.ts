import { NextRequest, NextResponse } from 'next/server';
import { TrainingData } from '../../../../models/TrainingData';
import { GitBookContent } from '../../../../models/GitBookContent';
import { v4 as uuidv4 } from 'uuid';

const SECRET_TRAINING_CODE = (process.env.SECRET_TRAINING_CODE || " ");
const EXIT_TRAINING_CODE = (process.env.EXIT_TRAINING_CODE || " ");

export async function POST(request: NextRequest) {
  try {
    const { message, userId, userAgent, ipAddress } = await request.json();

    if (!message || !userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Message and userId are required' 
      }, { status: 400 });
    }

    // console.log(`[Secret Training] Processing message from user: ${userId}`);

    // Check if this is the exit training code
    if (message.trim() === EXIT_TRAINING_CODE) {
    //   console.log(`[Secret Training] Exit training code detected! Ending training session for user: ${userId}`);
      
      // Find and deactivate the user's training session
      const activeSession = await TrainingData.getByUserId(userId);
      const currentSession = activeSession.find(session => 
        session.messages.some(msg => 
          msg.content === SECRET_TRAINING_CODE && 
          msg.role === 'user'
        )
      );

      if (currentSession) {
        // Mark session as inactive
        await TrainingData.delete(currentSession._id?.toString() || '');
        
        return NextResponse.json({
          success: true,
          message: 'Training mode deactivated! Messages are no longer being recorded.',
          sessionId: currentSession.sessionId,
          trainingMode: false,
          instructions: 'Training session ended. You can start a new one anytime with the secret code.'
        });
      }

      return NextResponse.json({
        success: true,
        message: 'No active training session found.',
        trainingMode: false
      });
    }

    // Check if this is the secret training code
    if (message.trim() === SECRET_TRAINING_CODE) {
    //   console.log(`[Secret Training] Secret code detected! Starting training session for user: ${userId}`);
      
      // Generate unique session ID
      const sessionId = uuidv4();
      
      // Create new training session
      const trainingSession = await TrainingData.create({
        userId,
        sessionId,
        messages: [{
          role: 'user',
          content: message,
          timestamp: new Date(),
          analysis: 'Secret training code activated - starting new training session'
        }],
        metadata: {
          userAgent,
          ipAddress,
          trainingPurpose: 'Secret training session initiated'
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Training session activated! I am now recording all messages for future analysis.',
        sessionId,
        trainingMode: true,
        instructions: 'All subsequent messages will be stored with AI analysis for training purposes. Continue chatting normally.'
      });
    }

    // Check if user has an active training session
    const activeSession = await TrainingData.getByUserId(userId);
    const currentSession = activeSession.find(session => 
      session.messages.some(msg => 
        msg.content === SECRET_TRAINING_CODE && 
        msg.role === 'user'
      )
    );

    if (currentSession) {
    //   console.log(`[Secret Training] Adding message to existing training session: ${currentSession.sessionId}`);
      
      // Add user message to training session
      await TrainingData.addMessage(currentSession.sessionId, {
        role: 'user',
        content: message,
        timestamp: new Date()
      });

      // Generate AI analysis of the message
      const analysis = await generateAIAnalysis(message);
      
      // Add AI analysis to training session
      await TrainingData.addMessage(currentSession.sessionId, {
        role: 'assistant',
        content: `AI Analysis: ${analysis}`,
        timestamp: new Date(),
        analysis: analysis
      });

      // ALSO store training data in gitbook_content collection for bot usage
      try {
        const analysisData = JSON.parse(analysis);
        
        // Create USEFUL training content that bot can actually use
        const trainingContent = {
          title: `${extractMainTopic(message)} - User Training`,
          content: message, // Store the actual user message as searchable content
          section: 'User Training Data',
          url: 'https://koasync.gitbook.io/',
          order: 999, // High order to appear at the end
          // Add metadata for better bot understanding
          metadata: {
            userQuestion: message,
            aiAnalysis: analysisData,
            trainingType: 'user_provided',
            keywords: analysisData.topics,
            intent: analysisData.intent,
            complexity: analysisData.complexity,
            sessionId: currentSession.sessionId,
            timestamp: new Date().toISOString()
          },
          // Add searchable keywords for better matching
          keywords: [
            ...analysisData.topics,
            extractMainTopic(message).toLowerCase(),
            ...message.toLowerCase().split(' ').filter((word: string) => word.length > 3)
          ]
        };

        await GitBookContent.create(trainingContent);
        // console.log(`[Secret Training] Training data stored in gitbook_content: ${message.substring(0, 30)}...`);
      } catch (error) {
        console.error('[Secret Training] Error storing in gitbook_content:', error);
      }

      // Generate a natural, conversational response based on the content
      const naturalResponse = generateNaturalResponse(message, analysis);
      
      return NextResponse.json({
        success: true,
        message: naturalResponse,
        sessionId: currentSession.sessionId,
        trainingMode: true,
        analysis: analysis,
        recordedMessage: message,
        instructions: 'Continue chatting - I\'m learning from our conversation!'
      });
    }

    // Normal message processing (not in training mode)
    return NextResponse.json({
      success: true,
      message: 'Message processed normally',
      trainingMode: false
    });

  } catch (error) {
    console.error('[Secret Training] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process training message',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper function to generate AI analysis
async function generateAIAnalysis(message: string): Promise<string> {
  try {
    // Simple analysis logic - can be enhanced with more sophisticated AI
    const analysis = {
      intent: analyzeIntent(message),
      sentiment: analyzeSentiment(message),
      topics: extractTopics(message),
      complexity: analyzeComplexity(message),
      suggestions: generateSuggestions(message)
    };

    return JSON.stringify(analysis, null, 2);
  } catch (error) {
    console.error('[AI Analysis] Error:', error);
    return 'Analysis failed - message recorded without analysis';
  }
}

function analyzeIntent(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('how') || lowerMessage.includes('what') || lowerMessage.includes('why')) {
    return 'question';
  } else if (lowerMessage.includes('help') || lowerMessage.includes('support')) {
    return 'help_request';
  } else if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
    return 'gratitude';
  } else if (lowerMessage.includes('bye') || lowerMessage.includes('goodbye')) {
    return 'farewell';
  } else if (lowerMessage.includes('koasync') || lowerMessage.includes('koa')) {
    return 'koasync_related';
  } else {
    return 'general_statement';
  }
}

function analyzeSentiment(message: string): string {
  const lowerMessage = message.toLowerCase();
  const positiveWords = ['good', 'great', 'awesome', 'amazing', 'love', 'like', 'happy', 'excited'];
  const negativeWords = ['bad', 'terrible', 'hate', 'dislike', 'sad', 'angry', 'frustrated', 'disappointed'];
  
  const positiveCount = positiveWords.filter(word => lowerMessage.includes(word)).length;
  const negativeCount = negativeWords.filter(word => lowerMessage.includes(word)).length;
  
  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

function extractTopics(message: string): string[] {
  const lowerMessage = message.toLowerCase();
  const topics = [];
  
  if (lowerMessage.includes('solana') || lowerMessage.includes('blockchain')) topics.push('blockchain');
  if (lowerMessage.includes('jupiter') || lowerMessage.includes('swap')) topics.push('defi');
  if (lowerMessage.includes('token') || lowerMessage.includes('coin')) topics.push('cryptocurrency');
  if (lowerMessage.includes('ai') || lowerMessage.includes('artificial intelligence')) topics.push('ai');
  if (lowerMessage.includes('anime') || lowerMessage.includes('character')) topics.push('anime');
  if (lowerMessage.includes('voice') || lowerMessage.includes('chat')) topics.push('communication');
  
  return topics.length > 0 ? topics : ['general'];
}

function analyzeComplexity(message: string): string {
  const wordCount = message.split(' ').length;
  const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(message);
  const hasNumbers = /\d/.test(message);
  
  if (wordCount > 20 || hasSpecialChars || hasNumbers) return 'high';
  if (wordCount > 10) return 'medium';
  return 'low';
}

function generateSuggestions(message: string): string[] {
  const suggestions = [];
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('jupiter')) {
    suggestions.push('Clarify that Jupiter integration is coming soon');
    suggestions.push('Direct to X page for updates');
  }
  
  if (lowerMessage.includes('roadmap')) {
    suggestions.push('Provide timeline overview');
    suggestions.push('Link to GitBook for details');
  }
  
  if (lowerMessage.includes('token')) {
    suggestions.push('Explain utility and access levels');
    suggestions.push('Mention subscription benefits');
  }
  
  return suggestions.length > 0 ? suggestions : ['Continue conversation naturally'];
}

function extractMainTopic(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('non-custodial') || lowerMessage.includes('custodial')) return 'Non-Custodial Trading';
  if (lowerMessage.includes('jupiter')) return 'Jupiter Integration';
  if (lowerMessage.includes('wallet') || lowerMessage.includes('transaction')) return 'Wallet & Transactions';
  if (lowerMessage.includes('automated') || lowerMessage.includes('service')) return 'Automated Services';
  if (lowerMessage.includes('market') || lowerMessage.includes('watching')) return 'Market Watching';
  if (lowerMessage.includes('koasync') || lowerMessage.includes('koa')) return 'Koasync Features';
  
  return 'General Training';
}

// Generate natural, conversational responses for training data
function generateNaturalResponse(message: string, analysis: string): string {
  try {
    const analysisData = JSON.parse(analysis);
    const lowerMessage = message.toLowerCase();
    
    // Generate contextual responses based on content
    if (lowerMessage.includes('jupiter')) {
      return "Thanks for sharing that about Jupiter integration! I'm learning about the planned features and will be able to give you better updates on this soon. Keep an eye on our X page for when it goes live!";
    }
    
    if (lowerMessage.includes('non-custodial') || lowerMessage.includes('wallet')) {
      return "Great information about our non-custodial approach! I'm understanding better how users maintain full control of their funds. This is a key feature that sets us apart.";
    }
    
    if (lowerMessage.includes('automated') || lowerMessage.includes('market')) {
      return "Thanks for explaining the automated market watching features! I'm learning how I can help users with pre-set parameters and trade execution. This will make me much more helpful!";
    }
    
    if (lowerMessage.includes('koasync') || lowerMessage.includes('koa')) {
      return "Thanks for teaching me more about Koasync! I'm learning the details so I can give you better, more accurate information about our platform.";
    }
    
    // Default natural response
    return "Thanks for sharing that information! I'm learning from our conversation and this will help me give you better answers in the future. Keep teaching me!";
    
  } catch (error) {
    return "Thanks for sharing that! I'm learning from our conversation and this will help me give you better answers in the future.";
  }
}
