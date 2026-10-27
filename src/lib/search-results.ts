/** Keep category identity independent of which searches are enabled or finish first. */
export async function collectSearchResults<T extends { [K in keyof T]: unknown[] }>(
  results: T,
  jobs: { [K in keyof T]?: PromiseLike<{ data: T[K] | null; error: unknown }> },
): Promise<T> {
  await Promise.all((Object.keys(jobs) as (keyof T)[]).map(async key => {
    const response = await jobs[key];
    if (!response) return;
    if (response.error) throw response.error;
    results[key] = response.data ?? [] as T[typeof key];
  }));
  return results;
}
