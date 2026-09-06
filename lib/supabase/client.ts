export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || supabaseUrl.includes('demo-Vinayaka-Chavithi') || !supabaseAnonKey) {
    // Return dummy client to prevent unhandled Webpack chunk errors
    return {
      from: () => ({
        select: () => Promise.resolve({ data: [], error: null }),
        insert: () => Promise.resolve({ data: null, error: null }),
        update: () => Promise.resolve({ data: null, error: null }),
        delete: () => Promise.resolve({ data: null, error: null }),
      }),
      storage: {
        from: () => ({
          upload: () => Promise.resolve({ data: null, error: null }),
          getPublicUrl: () => ({ data: { publicUrl: '' } }),
        }),
      },
    };
  }

  // Dynamically require @supabase/ssr only when live credentials are provided
  const { createBrowserClient } = require('@supabase/ssr');
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
