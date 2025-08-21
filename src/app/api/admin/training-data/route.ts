import { NextRequest, NextResponse } from 'next/server';
import { TrainingData } from '../../../../models/TrainingData';

export async function GET(request: NextRequest) {
  try {
    // Get all training data
    const allTrainingData = await TrainingData.getAll();
    
    // console.log(`[Admin] Retrieved ${allTrainingData.length} training sessions`);
    
    return NextResponse.json({
      success: true,
      count: allTrainingData.length,
      data: allTrainingData
    });
    
  } catch (error) {
    console.error('[Admin] Error retrieving training data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to retrieve training data',
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
        error: 'Training session ID is required' 
      }, { status: 400 });
    }

    const deleted = await TrainingData.delete(id);
    
    if (deleted) {
    //   console.log(`[Admin] Deleted training session: ${id}`);
      return NextResponse.json({
        success: true,
        message: 'Training session deleted successfully'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Training session not found or already deleted'
      }, { status: 404 });
    }
    
  } catch (error) {
    console.error('[Admin] Error deleting training data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete training data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
