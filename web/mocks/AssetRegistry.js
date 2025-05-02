const assets = new Map();

export function registerAsset(asset) {
  assets.set(asset.id, asset);
  return asset.id;
}

export function getAssetByID(id) {
  return assets.get(id);
}

export default {
  registerAsset,
  getAssetByID
}; 