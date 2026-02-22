import path from 'path';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  earlyAccess: true,
  schema: path.join(__dirname, 'prisma', 'schema.prisma'),
  seed: {
    command: 'npx ts-node prisma/seed.ts',
  },
});
