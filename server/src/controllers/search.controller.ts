import type { Request, Response } from 'express';
import { searchService } from '../services/search.service.js';
import { AppError } from '../middleware/errorHandler.js';

export const searchController = {
  async globalSearch(req: Request, res: Response) {
    if (!req.user || !req.user.agencyId) {
      throw new AppError('Agency context required', 400);
    }

    const query = (req.query.q as string) || '';
    if (!query.trim()) {
      throw new AppError('Search query is required', 400);
    }

    const results = await searchService.globalSearch(
      req.user.agencyId,
      query,
    );

    res.json(results);
  },
};
