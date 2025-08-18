export interface ClientData {
  clientId: string;
  messageCount: number;
  lastReset: number;
}

export interface ClientStatus {
  canSendMessage: boolean;
  messageCount: number;
  dailyLimit: number;
  timeUntilReset: number;
  isNewClient: boolean;
}

export interface ClientStatistics {
  totalClients: number;
  totalMessages: number;
  activeToday: number;
  dailyLimit: number;
}

export interface ClientInfo {
  id: string;
  clientId: string;
  messageCount: number;
  totalMessages: number;
  lastActive: Date;
  createdAt: Date;
  isActive: boolean;
}

export interface AdminClientsResponse {
  success: boolean;
  data: {
    clients: ClientInfo[];
    statistics: ClientStatus;
  };
}

export interface ClientIncrementResponse {
  success: boolean;
  data: ClientStatus;
  message?: string;
  error?: string;
}
