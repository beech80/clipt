// Retained for legacy callers, but browser clients must never provision
// buckets or change media visibility. Configure private buckets server-side.
export const createBucketIfNotExists = async (): Promise<never> => {
  throw new Error('Storage provisioning is unavailable in the browser. Use the development server-managed storage configuration.');
};
