// The clipgen schema is reached through prefixed views and functions in `public`
// (see supabase/migrations/0002_public_api.sql), so no schema exposure setting is required.
export function clipgenApi<T extends { from: any; rpc: any }>(client: T): T {
  return new Proxy(client, {
    get(target: any, prop) {
      if (prop === 'from') return (name: string) => target.from(`clipgen_${name}`);
      if (prop === 'rpc') return (name: string, args?: any, opts?: any) => target.rpc(`clipgen_${name}`, args, opts);
      const v = target[prop];
      return typeof v === 'function' ? v.bind(target) : v;
    },
  }) as T;
}
