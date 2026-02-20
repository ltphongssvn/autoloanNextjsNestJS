// apps/backend/src/notes/notes.controller.spec.ts
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';
import { JwtPayload } from '../auth/jwt.strategy';

describe('NotesController', () => {
  let controller: NotesController;
  const mockService = { create: jest.fn(), findByApplication: jest.fn() };
  const mockReq = (sub = 1) => ({
    user: { sub, email: 'test@test.com', role: 'loan_officer', jti: 'jti' } as JwtPayload,
  });

  beforeEach(() => {
    controller = new NotesController(mockService as unknown as NotesService);
    jest.clearAllMocks();
  });

  it('should create a note', async () => {
    mockService.create.mockResolvedValue({ id: 1, content: 'Note' });
    const result = await controller.create(1, mockReq(), 'Note');
    expect(mockService.create).toHaveBeenCalledWith(1, 1, 'Note');
    expect(result.content).toBe('Note');
  });

  it('should list notes', async () => {
    mockService.findByApplication.mockResolvedValue([{ id: 1 }]);
    const result = await controller.findByApplication(1);
    expect(result).toEqual([{ id: 1 }]);
  });
});
