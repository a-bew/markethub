export const logger = {
  info: (msg: string) => console.log(`[INFO]: ${msg}`),
  error: (msg: string, err?: any) => console.error(`[ERROR]: ${msg}`),
};
