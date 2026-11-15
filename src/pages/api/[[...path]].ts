import type { NextApiRequest, NextApiResponse } from 'next';
import { handleApiRequest } from '@/api/router';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '8mb',
    },
  },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return handleApiRequest(req, res);
}
