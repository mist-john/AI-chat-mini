# MongoDB Integration for KOA_CHAT

This document explains how user information is now stored and managed using MongoDB instead of just localStorage.

## 🗄️ Database Structure

### Client Collection (`clients`)
Each user/client is stored with the following fields:

```typescript
interface IClient {
  _id?: ObjectId;           // MongoDB document ID
  clientId: string;         // Unique client identifier
  messageCount: number;     // Messages sent today
  lastReset: number;        // Timestamp of last daily reset
  createdAt: Date;          // When client was first created
  updatedAt: Date;          // Last update timestamp
  userAgent?: string;       // Browser user agent
  ipAddress?: string;       // Client IP address
  lastActive: Date;         // Last activity timestamp
  totalMessages: number;    // Total messages ever sent
  isActive: boolean;        // Whether client is active
}
```

## 🔌 API Endpoints

### 1. Client Status (`/api/client/status`)

**GET** - Get client status
```
GET /api/client/status?clientId=client_123
```

**POST** - Create/update client
```json
POST /api/client/status
{
  "clientId": "client_123",
  "userAgent": "Mozilla/5.0...",
  "ipAddress": "192.168.1.1"
}
```

### 2. Message Increment (`/api/client/increment`)

**POST** - Increment message count
```json
POST /api/client/increment
{
  "clientId": "client_123"
}
```

**GET** - Get current status
```
GET /api/client/increment?clientId=client_123
```

### 3. Admin Clients (`/api/admin/clients`)

**GET** - View all active clients and statistics
```
GET /api/admin/clients
```

## 🚀 Features

### Daily Message Limits
- **100 messages per day** per client
- **Automatic reset** every 24 hours
- **Real-time tracking** of message counts
- **Graceful fallback** to localStorage if MongoDB fails

### Client Management
- **Automatic client creation** on first message
- **Persistent storage** across sessions
- **User agent tracking** for analytics
- **Activity monitoring** with timestamps

### Error Handling
- **Graceful degradation** to localStorage
- **Automatic retry** for failed operations
- **Comprehensive logging** for debugging
- **Fallback mechanisms** for offline scenarios

## 🔧 Setup Requirements

### Environment Variables
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/koa-chat?retryWrites=true&w=majority
```

### Dependencies
```json
{
  "mongodb": "^6.18.0",
  "mongoose": "^8.17.1"
}
```

## 📊 Usage Examples

### Creating a New Client
```typescript
import { Client } from '../models/Client';

const newClient = await Client.create({
  clientId: 'client_123',
  userAgent: navigator.userAgent,
  ipAddress: '192.168.1.1'
});
```

### Checking Message Limits
```typescript
const canSend = await Client.canSendMessage('client_123');
if (canSend) {
  // Allow message
} else {
  // Daily limit reached
}
```

### Getting Client Status
```typescript
const status = await Client.getClientStatus('client_123');
// console.log(`Messages today: ${status.messageCount}/${status.dailyLimit}`);
// console.log(`Can send: ${status.canSendMessage}`);
```

## 🛡️ Security Features

### Rate Limiting
- **Daily message limits** prevent abuse
- **Client validation** on all endpoints
- **Input sanitization** for all user data

### Data Privacy
- **No personal information** stored
- **Anonymous client IDs** only
- **Automatic cleanup** of inactive clients

## 🔍 Monitoring & Analytics

### Available Metrics
- **Total active clients**
- **Messages per client**
- **Daily activity patterns**
- **System usage statistics**

### Admin Dashboard
Access `/api/admin/clients` to view:
- All active clients
- Message statistics
- System health metrics
- Usage patterns

## 🚨 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Check `MONGODB_URI` environment variable
   - Verify network access to MongoDB Atlas
   - Check IP whitelist in MongoDB Atlas

2. **Message Count Not Updating**
   - Check browser console for errors
   - Verify API endpoints are accessible
   - Check MongoDB connection status

3. **Daily Limits Not Working**
   - Verify `lastReset` timestamp logic
   - Check timezone settings
   - Verify reset interval calculations

### Fallback Behavior
If MongoDB is unavailable, the system automatically falls back to localStorage:
- Message counts stored locally
- Daily limits still enforced
- Data persists in browser
- No data loss during outages

## 🔄 Migration from localStorage

The system automatically migrates existing localStorage clients:
1. **Detects existing client ID**
2. **Creates MongoDB record**
3. **Preserves message history**
4. **Maintains user experience**

## 📈 Performance Considerations

### Database Optimization
- **Indexed queries** on clientId
- **Efficient updates** using atomic operations
- **Connection pooling** for better performance
- **Minimal data transfer** between client/server

### Caching Strategy
- **Local state management** for immediate updates
- **Background synchronization** with MongoDB
- **Smart refresh** only when needed
- **Offline support** with localStorage fallback
