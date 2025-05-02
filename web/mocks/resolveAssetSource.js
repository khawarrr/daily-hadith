export default function resolveAssetSource(source) {
  if (!source) return null;
  
  if (typeof source === 'object') {
    return {
      uri: source.uri || '',
      width: source.width,
      height: source.height,
      scale: source.scale || 1,
    };
  }

  return null;
}

export function setCustomSourceTransformer() {
  // No-op implementation
} 