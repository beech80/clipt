// This only selects test UI/routing. The server still verifies Auth, MFA,
// designated ownership, the exact provider resource, test:true and <=300 seconds.
export function isMuxTestProject(projectUrl: unknown): boolean {
  return projectUrl === 'https://akiksrlzdqvipqbbjxpw.supabase.co';
}
