import { NextRequest, NextResponse } from 'next/server';
import { Client } from '../../../../models/Client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId } = body;

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    // Check if client can send message
    const canSendMessage = await Client.canSendMessage(clientId);

    if (!canSendMessage) {
      return NextResponse.json({
        success: false,
        error: 'Daily message limit reached',
        data: {
          canSendMessage: false,
          messageCount: 100, // Daily limit
          dailyLimit: 100,
          timeUntilReset: 0,
        },
      }, { status: 429 }); // Too Many Requests
    }

    // Increment message count
    const updatedClient = await Client.updateMessageCount(clientId, 1);

    if (!updatedClient) {
      return NextResponse.json(
        { error: 'Failed to update message count' },
        { status: 500 }
      );
    }

    // Get updated status
    const status = await Client.getClientStatus(clientId);

    return NextResponse.json({
      success: true,
      data: status,
      message: 'Message count incremented successfully',
    });
  } catch (error) {
    console.error('Error incrementing message count:', error);
    return NextResponse.json(
      { error: 'Failed to increment message count' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    const status = await Client.getClientStatus(clientId);

    return NextResponse.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('Error getting client status:', error);
    return NextResponse.json(
      { error: 'Failed to get client status' },
      { status: 500 }
    );
  }
} 
