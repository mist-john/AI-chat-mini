import { NextRequest, NextResponse } from 'next/server';
import { GitBookContent } from '../../../../models/GitBookContent';

export async function GET(request: NextRequest) {
  try {
    // Get all training data from gitbook_content collection
    const allContent = await GitBookContent.getAll();
    
    // Filter for user training data
    const trainingData = allContent.filter(item => 
      item.section === 'User Training Data'
    );
    
    // console.log(`[Admin] Retrieved ${trainingData.length} training items from gitbook_content`);
    
    return NextResponse.json({
      success: true,
      count: trainingData.length,
      data: trainingData,
      message: 'Training data from gitbook_content collection'
    });
    
  } catch (error) {
    console.error('[Admin] Error retrieving training data from gitbook_content:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to retrieve training data from gitbook_content',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    
    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Training item ID is required' 
      }, { status: 400 });
    }

    const deleted = await GitBookContent.delete(id);
    
    if (deleted) {
    //   console.log(`[Admin] Deleted training item from gitbook_content: ${id}`);
      return NextResponse.json({
        success: true,
        message: 'Training item deleted successfully from gitbook_content'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Training item not found or already deleted'
      }, { status: 404 });
    }
    
  } catch (error) {
    console.error('[Admin] Error deleting training item from gitbook_content:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete training item from gitbook_content',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
