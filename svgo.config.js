// Club badges render at 20–32px. Anything below ~1/10 of a pixel of path
// precision is invisible detail that every visitor still downloads.
export default {
  multipass: true,
  floatPrecision: 1,
  plugins: [
    { name: 'preset-default', params: { overrides: { removeViewBox: false } } },
    'removeDimensions',
    { name: 'convertPathData', params: { floatPrecision: 1, transformPrecision: 2 } },
    'reusePaths',
    'sortAttrs',
  ],
}
