import { NextRequest, NextResponse } from 'next/server';
import { Client } from '../../../../models/Client';

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, userAgent, ipAddress } = body;

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    // Check if client exists
    let client = await Client.findByClientId(clientId);

    if (!client) {
      // Create new client
      client = await Client.create({
        clientId,
        userAgent,
        ipAddress,
      });
    }

    const status = await Client.getClientStatus(clientId);

    return NextResponse.json({
      success: true,
      data: status,
      client: {
        id: client._id,
        clientId: client.clientId,
        createdAt: client.createdAt,
      },
    });
  } catch (error) {
    console.error('Error creating/updating client:', error);
    return NextResponse.json(
      { error: 'Failed to create/update client' },
      { status: 500 }
    );
  }
} 
