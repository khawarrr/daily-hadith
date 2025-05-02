export default class AssetSourceResolver {
  constructor(serverUrl, jsbundleUrl, asset) {
    this.serverUrl = serverUrl;
    this.jsbundleUrl = jsbundleUrl;
    this.asset = asset;
  }

  scaledAssetPath() {
    return this.asset.uri || '';
  }

  assetServerURL() {
    return this.serverUrl || '';
  }

  static pickScale(scales, deviceScale) {
    return scales[0] || 1;
  }
} 