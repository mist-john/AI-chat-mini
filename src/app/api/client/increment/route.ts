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

    //---------------- Find client-------------------//
    const client = await Client.findOne({ clientId });
    
    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // ------------------------Check if client can send messages--------------------------//
    if (!client.canSendMessage()) {
      return NextResponse.json(
        { error: 'Message limit reached' },
        { status: 429 }
      );
    }

    //------------------------------ Increment message count--------------------------------//
    client.incrementMessageCount();
    await client.save();
    
    return NextResponse.json({
      clientId: client.clientId,
      messageCount: client.messageCount,
      lastReset: client.lastReset,
      canSendMessage: client.canSendMessage(),
      messageLimit: 100,
    });
    
  } catch (error) {
    console.error('Error in client increment API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
