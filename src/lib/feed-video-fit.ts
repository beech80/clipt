/** Letterbox mismatched video/view orientations; never stretch the source. */
export function feedVideoFit(portraitVideo: boolean | undefined, landscapeViewport: boolean): 'contain' | 'cover' {
  // Metadata can arrive after playback starts. Avoid a flash of cropped video.
  return portraitVideo === undefined || portraitVideo === landscapeViewport ? 'contain' : 'cover';
}
