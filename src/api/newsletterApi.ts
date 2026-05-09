import axios from 'axios';

import { publicApi } from './apiClient';

export interface NewsletterSubscribeRequest {
  email: string;
  source?: string;
}

export interface NewsletterResponse {
  success: boolean;
  message: string;
}

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const unwrapResponse = (response: unknown): unknown => {
  if (!isRecord(response)) return response;

  const data = response.data;

  if (isRecord(data) && 'data' in data) {
    return data.data;
  }

  return data ?? response;
};

const normalizeNewsletterResponse = (
  payload: unknown,
  fallbackMessage: string
): NewsletterResponse => {
  if (!isRecord(payload)) {
    return {
      success: true,
      message: fallbackMessage,
    };
  }

  return {
    success: payload.success !== false,
    message:
      typeof payload.message === 'string' && payload.message.trim()
        ? payload.message.trim()
        : fallbackMessage,
  };
};

const readErrorMessage = (payload: unknown): string | null => {
  if (typeof payload === 'string' && payload.trim()) {
    return payload.trim();
  }

  if (!isRecord(payload)) {
    return null;
  }

  if (Array.isArray(payload.details) && payload.details.length > 0) {
    const details = payload.details
      .filter((detail): detail is string => typeof detail === 'string' && Boolean(detail.trim()))
      .map((detail) => detail.trim())
      .join(', ');

    if (details) {
      return details;
    }
  }

  if (typeof payload.message === 'string' && payload.message.trim()) {
    return payload.message.trim();
  }

  if (typeof payload.error === 'string' && payload.error.trim()) {
    return payload.error.trim();
  }

  if ('data' in payload) {
    return readErrorMessage(payload.data);
  }

  return null;
};

export const getNewsletterErrorMessage = (
  error: unknown,
  fallback = 'Something went wrong. Please try again.'
) => {
  if (axios.isAxiosError(error)) {
    return readErrorMessage(error.response?.data) || error.message || fallback;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }

  return fallback;
};

export const subscribeToNewsletter = async ({
  email,
  source,
}: NewsletterSubscribeRequest): Promise<NewsletterResponse> => {
  const response = await publicApi.post('/public/newsletter/subscribe', {
    email: email.trim(),
    ...(source ? { source } : {}),
  });

  return normalizeNewsletterResponse(unwrapResponse(response), 'Subscribed successfully.');
};

export const unsubscribeFromNewsletter = async (
  email: string
): Promise<NewsletterResponse> => {
  const response = await publicApi.get('/public/newsletter/unsubscribe', {
    params: { email: email.trim() },
  });

  return normalizeNewsletterResponse(
    unwrapResponse(response),
    'You have been unsubscribed successfully.'
  );
};
