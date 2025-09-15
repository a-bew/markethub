declare module "bun:test" {
  export const test: (name: string, fn: () => any | Promise<any>) => void;
  export const expect: any;
  export const describe: (name: string, fn: () => void) => void;
  export const it: (name: string, fn: () => any | Promise<any>) => void;
  export const beforeAll: (fn: () => any | Promise<any>) => void;
  export const afterAll: (fn: () => any | Promise<any>) => void;
  export const beforeEach: (fn: () => any | Promise<any>) => void;
  export const afterEach: (fn: () => any | Promise<any>) => void;
  export const skip: (name: string, fn: () => any | Promise<any>) => void;
  export const todo: (name: string, fn: () => any | Promise<any>) => void;
  export const only: (name: string, fn: () => any | Promise<any>) => void;
  
}
