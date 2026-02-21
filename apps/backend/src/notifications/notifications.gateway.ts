import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/notifications' })
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(NotificationsGateway.name);
  private readonly userSockets = new Map<number, Set<string>>();

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.query?.token;
      if (!token) { client.disconnect(); return; }
      const payload = this.jwtService.verify(token as string);
      const userId = payload.sub;
      client.data.userId = userId;
      if (!this.userSockets.has(userId)) this.userSockets.set(userId, new Set());
      this.userSockets.get(userId)!.add(client.id);
      client.join(`user:${userId}`);
      this.logger.log(`Client connected: ${client.id} (user: ${userId})`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data?.userId;
    if (userId && this.userSockets.has(userId)) {
      this.userSockets.get(userId)!.delete(client.id);
      if (this.userSockets.get(userId)!.size === 0) this.userSockets.delete(userId);
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  notifyUser(userId: number, event: string, data: Record<string, unknown>) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  notifyStatusChange(userId: number, applicationId: number, applicationNumber: string, oldStatus: string, newStatus: string) {
    this.notifyUser(userId, 'status_change', { applicationId, applicationNumber, oldStatus, newStatus, timestamp: new Date().toISOString() });
  }

  notifyDocumentUploaded(userId: number, applicationId: number, applicationNumber: string, docType: string) {
    this.notifyUser(userId, 'document_uploaded', { applicationId, applicationNumber, docType, timestamp: new Date().toISOString() });
  }

  notifyApplicationSubmitted(userId: number, applicationId: number, applicationNumber: string) {
    this.notifyUser(userId, 'application_submitted', { applicationId, applicationNumber, timestamp: new Date().toISOString() });
  }
}
