import { config } from 'dotenv';
config();

import '@/ai/flows/suggest-delivery-routes.ts';
import '@/ai/flows/summarize-delivery-data.ts';
import '@/ai/flows/prioritize-delivery-schedule.ts';