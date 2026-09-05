declare module 'qrious' {
  interface QRiousOptions {
    element?: HTMLCanvasElement | null;
    value?: string;
    size?: number;
    background?: string;
    foreground?: string;
    level?: string;
  }

  class QRious {
    constructor(options: QRiousOptions);
  }

  export default QRious;
}
