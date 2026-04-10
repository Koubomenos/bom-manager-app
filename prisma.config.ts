import { defineConfig } from '@prisma/config';
import { config } from 'dotenv';

config(); 

export default defineConfig({
  datasource: {
    // Άλλαξέ το προσωρινά σε NON_POOLING για να ξεκολλήσει!
    url: process.env.POSTGRES_URL_NON_POOLING,
    // @ts-ignore
    directUrl: process.env.POSTGRES_URL_NON_POOLING,
  },
});