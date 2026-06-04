import type { NextFunction, Request, Response } from "express";
import { aiService, type AiHistoryItem } from "./ai.service";

type AiBody = {
  message: string;
  history?: AiHistoryItem[];
};

function getBody(req: Request): AiBody {
  return req.body as AiBody;
}

export const aiController = {
  async publicAdvisor(req: Request, res: Response, next: NextFunction) {
    try {
      const body = getBody(req);
      const data = await aiService.ask({
        role: "public",
        message: body.message,
        history: body.history,
      });

      return res.json({ ok: true, data });
    } catch (error) {
      return next(error);
    }
  },

  async studentAssistant(req: Request, res: Response, next: NextFunction) {
    try {
      const body = getBody(req);
      const data = await aiService.ask({
        role: "student",
        message: body.message,
        history: body.history,
        userId: req.user?.id,
      });

      return res.json({ ok: true, data });
    } catch (error) {
      return next(error);
    }
  },

  async teacherAssistant(req: Request, res: Response, next: NextFunction) {
    try {
      const body = getBody(req);
      const data = await aiService.ask({
        role: "teacher",
        message: body.message,
        history: body.history,
        userId: req.user?.id,
      });

      return res.json({ ok: true, data });
    } catch (error) {
      return next(error);
    }
  },

  async adminAssistant(req: Request, res: Response, next: NextFunction) {
    try {
      const body = getBody(req);
      const data = await aiService.ask({
        role: "admin",
        message: body.message,
        history: body.history,
        userId: req.user?.id,
      });

      return res.json({ ok: true, data });
    } catch (error) {
      return next(error);
    }
  },

  async adminNotificationDraft(req: Request, res: Response, next: NextFunction) {
    try {
      const body = req.body as { prompt: string };
      const data = await aiService.adminNotificationDraft({
        prompt: body.prompt,
        userId: req.user?.id,
      });

      return res.json({ ok: true, data });
    } catch (error) {
      return next(error);
    }
  },
};
