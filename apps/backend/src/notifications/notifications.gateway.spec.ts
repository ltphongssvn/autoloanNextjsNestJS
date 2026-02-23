import { NotificationsGateway } from './notifications.gateway';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

describe('NotificationsGateway', () => {
  let gateway: NotificationsGateway;
  const mockJwtService = { verify: jest.fn() };
  const mockServer = { to: jest.fn().mockReturnThis(), emit: jest.fn() };

  beforeEach(() => {
    gateway = new NotificationsGateway(mockJwtService as unknown as JwtService);
    (gateway as any).server = mockServer;
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const makeSocket = (token?: string): Partial<Socket> => ({
    id: 'sock-1',
    handshake: { auth: { token }, query: {} } as any,
    data: {},
    join: jest.fn(),
    disconnect: jest.fn(),
  });

  describe('handleConnection', () => {
    it('authenticates and joins user room', async () => {
      mockJwtService.verify.mockReturnValue({ sub: 42 });
      const client = makeSocket('valid-token');
      await gateway.handleConnection(client as Socket);
      expect(mockJwtService.verify).toHaveBeenCalledWith('valid-token');
      expect(client.join).toHaveBeenCalledWith('user:42');
      expect(client.data!.userId).toBe(42);
    });

    it('uses query token if auth token missing', async () => {
      mockJwtService.verify.mockReturnValue({ sub: 10 });
      const client: Partial<Socket> = {
        id: 'sock-2', handshake: { auth: {}, query: { token: 'q-token' } } as any,
        data: {}, join: jest.fn(), disconnect: jest.fn(),
      };
      await gateway.handleConnection(client as Socket);
      expect(mockJwtService.verify).toHaveBeenCalledWith('q-token');
    });

    it('disconnects if no token', async () => {
      const client = makeSocket(undefined);
      await gateway.handleConnection(client as Socket);
      expect(client.disconnect).toHaveBeenCalled();
    });

    it('disconnects on invalid token', async () => {
      mockJwtService.verify.mockImplementation(() => { throw new Error('bad'); });
      const client = makeSocket('bad-token');
      await gateway.handleConnection(client as Socket);
      expect(client.disconnect).toHaveBeenCalled();
    });

    it('tracks multiple sockets for same user', async () => {
      mockJwtService.verify.mockReturnValue({ sub: 1 });
      const c1 = makeSocket('t1');
      const c2 = { ...makeSocket('t2'), id: 'sock-2', join: jest.fn(), disconnect: jest.fn(), data: {} };
      await gateway.handleConnection(c1 as Socket);
      await gateway.handleConnection(c2 as unknown as Socket);
      expect(c1.disconnect).not.toHaveBeenCalled();
      expect(c2.disconnect).not.toHaveBeenCalled();
    });
  });

  describe('handleDisconnect', () => {
    it('removes socket from tracking', async () => {
      mockJwtService.verify.mockReturnValue({ sub: 5 });
      const client = makeSocket('tok');
      await gateway.handleConnection(client as Socket);
      gateway.handleDisconnect(client as Socket);
    });

    it('cleans up user entry when last socket disconnects', async () => {
      mockJwtService.verify.mockReturnValue({ sub: 7 });
      const client = makeSocket('tok');
      await gateway.handleConnection(client as Socket);
      gateway.handleDisconnect(client as Socket);
      await gateway.handleConnection(client as Socket);
      expect(client.join).toHaveBeenCalledWith('user:7');
    });

    it('handles disconnect without userId', () => {
      const client: Partial<Socket> = { id: 'unknown', data: {} };
      gateway.handleDisconnect(client as Socket);
    });
  });

  describe('notifyUser', () => {
    it('emits to user room', () => {
      gateway.notifyUser(1, 'test_event', { foo: 'bar' });
      expect(mockServer.to).toHaveBeenCalledWith('user:1');
      expect(mockServer.emit).toHaveBeenCalledWith('test_event', { foo: 'bar' });
    });
  });

  describe('notifyStatusChange', () => {
    it('emits status_change event', () => {
      gateway.notifyStatusChange(1, 10, 'AL-0001', 'submitted', 'under_review');
      expect(mockServer.emit).toHaveBeenCalledWith('status_change', expect.objectContaining({
        applicationId: 10, applicationNumber: 'AL-0001', oldStatus: 'submitted', newStatus: 'under_review',
      }));
    });
  });

  describe('notifyDocumentUploaded', () => {
    it('emits document_uploaded event', () => {
      gateway.notifyDocumentUploaded(1, 10, 'AL-0001', 'pay_stub');
      expect(mockServer.emit).toHaveBeenCalledWith('document_uploaded', expect.objectContaining({
        applicationId: 10, docType: 'pay_stub',
      }));
    });
  });

  describe('notifyApplicationSubmitted', () => {
    it('emits application_submitted event', () => {
      gateway.notifyApplicationSubmitted(1, 10, 'AL-0001');
      expect(mockServer.emit).toHaveBeenCalledWith('application_submitted', expect.objectContaining({
        applicationId: 10, applicationNumber: 'AL-0001',
      }));
    });
  });
});
