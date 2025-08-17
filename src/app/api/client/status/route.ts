import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Client, { IClientModel } from '@/models/Client';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { clientId } = await request.json();
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    // ------------------Get client IP and user agent for tracking--------------------------//
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // --------------------------------------Find or create client-----------------------------//
    const client = await (Client as IClientModel).findOrCreateClient(clientId, ipAddress, userAgent);
    
    // --------------------------------------Check if client can send messages----------------------//
    const canSendMessage = client.canSendMessage();
    
    return NextResponse.json({
      clientId: client.clientId,
      messageCount: client.messageCount,
      lastReset: client.lastReset,
      canSendMessage,
      messageLimit: 100,
    });
    
  } catch (error) {
    console.error('Error in client status API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
