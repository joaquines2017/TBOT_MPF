

import typescript from 'rollup-plugin-typescript2';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';

export default {
  input: './src/app.ts',
output: {
  entryFileNames: 'app.js',
  dir: 'dist',
  format: 'esm',
  sourcemap: true
},
  plugins: [
    nodeResolve(),
    json(),
    commonjs(),
    typescript()
  ],
  external: [
    'axios',
    'form-data',
    'node-domexception',
    'fetch-blob',
    'qrcode-terminal',
    '@ffmpeg-installer/ffmpeg',
    '@ffmpeg-installer',
    'ffmpeg',
    'fluent-ffmpeg',
    '@ffprobe-installer/ffprobe',
    'ffprobe',
    'sharp'
  ]
};
