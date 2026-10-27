export const DEVELOPMENT_PROJECT = 'akiksrlzdqvipqbbjxpw';
export function requireDevelopmentTarget(env) {
  if (env.CLIPT_TEST_PROJECT_REF !== DEVELOPMENT_PROJECT) {
    throw new Error('Fixture writes disabled: explicitly select the isolated development project. The original production-shared project is forbidden.');
  }
  if (env.CLIPT_TEST_SCHEMA_VERIFIED !== DEVELOPMENT_PROJECT) {
    throw new Error('Fixture writes disabled until the isolated development schema is verified.');
  }
  if (env.CLIPT_TEST_PREVIEW_ACCESS) {
    const preview = new URL(env.CLIPT_TEST_PREVIEW_ACCESS);
    if (!env.CLIPT_TEST_PREVIEW_BASE || new URL(env.CLIPT_TEST_PREVIEW_BASE).origin !== preview.origin ||
        env.CLIPT_TEST_PREVIEW_BACKEND_VERIFIED !== DEVELOPMENT_PROJECT) {
      throw new Error('Preview fixture writes disabled until the deployment backend is verified as isolated development.');
    }
  }
  return DEVELOPMENT_PROJECT;
}
