// Draw 빌드: Electron Forge 의 webpack 플러그인이 하던 일을 webpack 으로 직접 한다.
// 결과는 Forge 와 같은 모양(.webpack/main · .webpack/renderer/<창>/)이라 원본 DrawPen 코드를 거의 그대로 둔다.
// electron-builder 가 이 폴더를 묶는다(builder.config.cjs).
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const rootDir = path.resolve(__dirname, '../..');
const outDir = path.join(rootDir, '.webpack');
const isDev = process.env.NODE_ENV === 'development';
const mode = isDev ? 'development' : 'production';

const mainBase = require('../webpack/main.js');
const rendererBase = require('../webpack/renderer.js');

const windows = ['app_window', 'extended_toolbar_window', 'about_window', 'settings_window', 'panel_window', 'update_window'];
const pageDir = (name) => path.join(rootDir, 'src/renderer', name.replace(/_window$/, '_page'));

// 메인 프로세스가 쓰는 <창>_WEBPACK_ENTRY · <창>_PRELOAD_WEBPACK_ENTRY 값. 실행 중의 __dirname(.webpack/main) 기준.
const entryDefines = {};
for (const name of windows) {
  const upper = name.toUpperCase();
  entryDefines[`${upper}_WEBPACK_ENTRY`] =
    `require('url').pathToFileURL(require('path').join(__dirname, '../renderer/${name}/index.html')).href`;
  entryDefines[`${upper}_PRELOAD_WEBPACK_ENTRY`] =
    `require('path').join(__dirname, '../renderer/${name}/preload.js')`;
}

// 시험판 화면 찍기 코드(src/main/testShots.js)는 출시 빌드(DRAW_RELEASE=1)에 들어가지 않는다.
entryDefines.DRAW_TEST_BUILD = JSON.stringify(process.env.DRAW_RELEASE !== '1');

const mainConfig = {
  ...mainBase,
  mode,
  target: 'electron-main',
  devtool: isDev ? 'source-map' : false,
  node: { __dirname: false, __filename: false },
  output: { path: path.join(outDir, 'main'), filename: 'index.js' },
  plugins: [...(mainBase.plugins || []), new webpack.DefinePlugin(entryDefines)],
  externals: { electron: 'commonjs2 electron' },
};

const rendererConfigs = windows.flatMap((name) => [
  {
    ...rendererBase,
    mode,
    target: 'web',
    devtool: isDev ? 'inline-source-map' : false,
    entry: path.join(pageDir(name), 'index.js'),
    output: { path: path.join(outDir, 'renderer', name), filename: 'index.js', publicPath: './' },
    plugins: [
      ...rendererBase.plugins.filter((p) => !(p instanceof webpack.HotModuleReplacementPlugin)),
      new HtmlWebpackPlugin({ template: path.join(pageDir(name), 'index.html'), filename: 'index.html' }),
    ],
  },
  {
    mode,
    target: 'electron-preload',
    devtool: false,
    entry: path.join(pageDir(name), 'preload.js'),
    output: { path: path.join(outDir, 'renderer', name), filename: 'preload.js' },
    externals: { electron: 'commonjs2 electron' },
  },
]);

webpack([mainConfig, ...rendererConfigs], (err, stats) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  const info = stats.toString({ colors: true, chunks: false, modules: false, assets: false });
  if (stats.hasErrors()) {
    console.error(info);
    process.exit(1);
  }
  console.log(isDev ? info : 'Draw 빌드 끝: .webpack/');
});
