import { nanoid } from 'nanoid';

export const generateOrderCode = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = nanoid(6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
};