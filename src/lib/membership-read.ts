/** Bound read-only status checks, including an SDK request stalled before fetch. */
export async function membershipRead<T>(read: (signal: AbortSignal) => PromiseLike<T>, timeoutMs = 15000): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      Promise.resolve().then(() => read(controller.signal)),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          controller.abort();
          reject(new Error('Membership status check timed out. Retry status; no membership is assumed.'));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}
