// Stub Supabase client for demo mode.
// The app enters demo mode immediately (no real Supabase credentials present),
// so none of the real DB/auth calls ever fire — this stub just needs to exist
// and not throw on import.

const makeChain = (): any =>
  new Proxy(
    (..._args: any[]) => Promise.resolve({ data: null, error: null }),
    {
      get: (_t, _p) => makeChain(),
      apply: (_t, _thisArg, _args) =>
        Promise.resolve({ data: null, error: null }),
    }
  );

export const supabase = {
  auth: {
    getSession: () =>
      Promise.resolve({ data: { session: null }, error: null }),
    onAuthStateChange: (_event: any, _cb: any) => ({
      data: { subscription: { unsubscribe: () => {} } },
    }),
    signInWithPassword: (_opts: any) =>
      Promise.resolve({ error: { message: 'Use demo mode — no Supabase configured.' } }),
    signUp: (_opts: any) =>
      Promise.resolve({ error: { message: 'Use demo mode — no Supabase configured.' } }),
    signOut: () => Promise.resolve({}),
  },
  from: (_table: string) => makeChain(),
};

export const apiPost = async (_path: string, _body: any): Promise<any> => {
  throw new Error('Backend not available in demo mode.');
};

export const apiPut = async (_path: string, _body: any): Promise<any> => {
  throw new Error('Backend not available in demo mode.');
};
