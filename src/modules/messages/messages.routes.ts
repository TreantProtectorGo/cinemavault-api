import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { authorizeRoles } from "../../middleware/authorizeRoles.js";
import {
  createMessageSchema,
  messageIdParamSchema,
  messageQuerySchema,
  replyMessageSchema
} from "./messages.schemas.js";
import {
  createUserMessage,
  deleteMessage,
  listAdminMessages,
  listUserMessages,
  replyToMessage
} from "./messages.service.js";

export const messagesRouter = Router();
export const adminMessagesRouter = Router();

messagesRouter.use(authenticate);

messagesRouter.get("/", async (req, res, next) => {
  try {
    const query = messageQuerySchema.parse(req.query);
    const result = await listUserMessages(req.user!, query);

    res.json(result);
  } catch (error) {
    next(error);
  }
});

messagesRouter.post("/", async (req, res, next) => {
  try {
    const input = createMessageSchema.parse(req.body);
    const message = await createUserMessage(req.user!.id, input);

    res.status(201).json(message);
  } catch (error) {
    next(error);
  }
});

adminMessagesRouter.use(authenticate, authorizeRoles("ADMIN"));

adminMessagesRouter.get("/", async (req, res, next) => {
  try {
    const query = messageQuerySchema.parse(req.query);
    const result = await listAdminMessages(query);

    res.json(result);
  } catch (error) {
    next(error);
  }
});

adminMessagesRouter.post("/:id/reply", async (req, res, next) => {
  try {
    const { id } = messageIdParamSchema.parse(req.params);
    const input = replyMessageSchema.parse(req.body);
    const message = await replyToMessage(id, req.user!.id, input);

    res.json(message);
  } catch (error) {
    next(error);
  }
});

adminMessagesRouter.delete("/:id", async (req, res, next) => {
  try {
    const { id } = messageIdParamSchema.parse(req.params);
    const message = await deleteMessage(id);

    res.json(message);
  } catch (error) {
    next(error);
  }
});
