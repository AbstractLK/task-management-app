import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const app = express();
const port = process.env.TASK_PORT || process.env.PORT || 4002;
const jwtSecret = process.env.JWT_SECRET || 'change-me-in-kubernetes-secret';
const corsOrigin = process.env.TASK_CORS_ORIGIN || process.env.CORS_ORIGIN || true;
const mongodbUri = process.env.TASK_MONGODB_URI || process.env.MONGODB_URI;

app.use(helmet());
app.use(cors({ origin: corsOrigin }));
app.use(express.json());

const taskSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    completed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Task = mongoose.model('Task', taskSchema);

function authenticate(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'missing token' });
  }

  try {
    req.user = jwt.verify(token, jwtSecret);
    next();
  } catch {
    res.status(401).json({ message: 'invalid token' });
  }
}

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'task-service' });
});

app.get('/', authenticate, async (req, res, next) => {
  try {
    const tasks = await Task.find({ userId: req.user.sub }).sort({ createdAt: -1 });
    res.json({ tasks });
  } catch (error) {
    next(error);
  }
});

app.post('/', authenticate, async (req, res, next) => {
  try {
    if (!req.body.title) {
      return res.status(400).json({ message: 'title is required' });
    }

    const task = await Task.create({ userId: req.user.sub, title: req.body.title });
    res.status(201).json({ task });
  } catch (error) {
    next(error);
  }
});

app.put('/:id', authenticate, async (req, res, next) => {
  try {
    const update = {};
    if (req.body.title !== undefined) update.title = req.body.title;
    if (req.body.completed !== undefined) update.completed = req.body.completed;

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.sub },
      { $set: update },
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({ message: 'task not found' });
    }

    res.json({ task });
  } catch (error) {
    next(error);
  }
});

app.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.user.sub });
    if (!task) {
      return res.status(404).json({ message: 'task not found' });
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: 'internal server error' });
});

async function start() {
  if (!mongodbUri) {
    throw new Error('TASK_MONGODB_URI is required');
  }

  await mongoose.connect(mongodbUri);
  app.listen(port, () => {
    console.log(`task-service listening on ${port}`);
  });
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
