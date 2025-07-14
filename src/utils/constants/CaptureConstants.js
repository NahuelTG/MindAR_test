// 17. src/utils/constants/CaptureConstants.js
export const CAPTURE_CONSTANTS = {
  JPEG_QUALITY: 0.9,
  HIGH_RES_SCALE: 2,
  RENDER_DELAY: 50,
  WEBGL_DELAY: 100,
  CAMERA_CONSTRAINTS: {
    facingMode: 'environment',
    width: { ideal: 1920 },
    height: { ideal: 1080 },
  },
  PREVIEW_STYLES: {
    OVERLAY_Z_INDEX: 10000,
    COLORS: {
      SUCCESS: '#4CAF50',
      SUCCESS_HOVER: '#45a049',
      INFO: '#2196F3',
      INFO_HOVER: '#1976D2',
      ERROR: '#f44336',
      ERROR_HOVER: '#d32f2f',
      WARNING: '#ff9800',
    },
  },
}
