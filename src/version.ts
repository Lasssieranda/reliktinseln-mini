declare const __APP_VERSION__: string;

export const VERSION: string =
  typeof __APP_VERSION__ === 'string' && __APP_VERSION__.length > 0
    ? __APP_VERSION__
    : '0.1.0';
