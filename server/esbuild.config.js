import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  outfile: 'bundle/server.js',
  // Prisma must be external — it needs its generated client + query engine at runtime
  external: ['@prisma/client', '.prisma/client'],
  banner: {
    // Provide require() for CJS packages that need it in ESM context
    js: `import { createRequire } from 'module'; const require = createRequire(import.meta.url);`,
  },
  minify: false,
  sourcemap: true,
});

console.log('✅ Bundle created at bundle/server.js');
