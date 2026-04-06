import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  outfile: 'bundle/server.js',
  // Prisma generated client + runtime must be external (loaded from node_modules at runtime)
  external: ['generated-prisma-client', '@prisma/client', '@prisma/client/*'],
  banner: {
    // Provide require() for CJS packages that need it in ESM context
    js: `import { createRequire } from 'module'; const require = createRequire(import.meta.url);`,
  },
  minify: false,
  sourcemap: true,
});

console.log('✅ Bundle created at bundle/server.js');
