import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

export type AIProvider = 'gemini' | 'openai' | 'claude';

const getEncryptionKey = () => {
  const secret = process.env.AI_CREDENTIALS_ENCRYPTION_KEY || process.env.AUTH_SECRET;
  if (!secret) throw new Error('AI_CREDENTIALS_ENCRYPTION_KEY or AUTH_SECRET is required to encrypt AI credentials');
  return createHash('sha256').update(secret).digest();
};

export const encryptApiKey = (value: string) => {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}.${tag.toString('base64')}.${encrypted.toString('base64')}`;
};

export const decryptApiKey = (value: string) => {
  const [ivValue, tagValue, encryptedValue] = value.split('.');
  if (!ivValue || !tagValue || !encryptedValue) throw new Error('Invalid encrypted API key');
  const decipher = createDecipheriv('aes-256-gcm', getEncryptionKey(), Buffer.from(ivValue, 'base64'));
  decipher.setAuthTag(Buffer.from(tagValue, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(encryptedValue, 'base64')), decipher.final()]).toString('utf8');
};

export const maskApiKey = (value: string) => value.length > 8 ? `${value.slice(0, 4)}...${value.slice(-4)}` : '••••••••';