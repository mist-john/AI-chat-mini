import { NextRequest, NextResponse } from 'next/server';
import { Client } from '../../../../models/Client';

export async function GET(request: NextRequest) {
  try {
    // In a real app, you'd add authentication here
    // For now, this is a simple admin endpoint
    
    const clients = await Client.getActiveClients();
    
    // Calculate some statistics
    const totalClients = clients.length;
    const totalMessages = clients.reduce((sum, client) => sum + client.totalMessages, 0);
    const activeToday = clients.filter(client => {
      const timeSinceReset = Date.now() - client.lastReset;
      return timeSinceReset < 24 * 60 * 60 * 1000; // Last 24 hours
    }).length;

    return NextResponse.json({
      success: true,
      data: {
        clients: clients.map(client => ({
          id: client._id,
          clientId: client.clientId,
          messageCount: client.messageCount,
          totalMessages: client.totalMessages,
          lastActive: client.lastActive,
          createdAt: client.createdAt,
          isActive: client.isActive,
        })),
        statistics: {
          totalClients,
          totalMessages,
          activeToday,
          dailyLimit: Client.DAILY_MESSAGE_LIMIT,
        },
      },
    });
  } catch (error) {
    console.error('Error getting clients:', error);
    return NextResponse.json(
      { error: 'Failed to get clients' },
      { status: 500 }
    );
  }
}
