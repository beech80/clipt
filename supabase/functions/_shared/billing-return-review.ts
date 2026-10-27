// Diagnostic only. This does not authorize Checkout or change configuration.
export const currentDevelopmentPreviewOrigin = 'https://clipttest-pxc4r44p0-matthew-beechers-projects.vercel.app'

export function billingReturnReview(value: string | undefined) {
 let returnOriginValid = false
 let returnOriginMatchesCurrentPreview = false
 try {
  const origin = new URL(value ?? '')
  returnOriginValid = value === value?.trim() && origin.protocol === 'https:'
   && !origin.username && !origin.password && origin.pathname === '/'
   && !origin.search && !origin.hash
  returnOriginMatchesCurrentPreview = returnOriginValid && origin.origin === currentDevelopmentPreviewOrigin
 } catch { /* Never return malformed values, credentials, paths, or queries. */ }
 return { returnOriginValid, returnOriginMatchesCurrentPreview }
}
