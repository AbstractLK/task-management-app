import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

// const __dirname = path.dirname(fileURLToPath(import.meta.url));
// dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const app = express();
const port = process.env.AUTH_PORT || process.env.PORT || 4001;
const jwtSecret = process.env.JWT_SECRET || 'change-me-in-kubernetes-secret';
const corsOrigin = process.env.AUTH_CORS_ORIGIN || process.env.CORS_ORIGIN || true;
const mongodbUri = process.env.AUTH_MONGODB_URI || process.env.MONGODB_URI;

app.use(helmet());
app.use(cors({ origin: corsOrigin }));
app.use(express.json());

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);

function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), email: user.email, name: user.name },
    jwtSecret,
    { expiresIn: '1d' }
  );
}

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'auth-service' });
});

app.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email, and password are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'email is already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash });
    res.status(201).json({ token: signToken(user), user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    next(error);
  }
});

app.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: 'invalid credentials' });
    }

    res.json({ token: signToken(user), user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    next(error);
  }
});

app.get('/me', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'missing token' });
  }

  try {
    const user = jwt.verify(token, jwtSecret);
    res.json({ user });
  } catch {
    res.status(401).json({ message: 'invalid token' });
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: 'internal server error' });
});

async function start() {
  if (!mongodbUri) {
    throw new Error('AUTH_MONGODB_URI is required');
  }

  await mongoose.connect(mongodbUri);
  app.listen(port, () => {
    console.log(`auth-service listening on ${port}`);
  });
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
