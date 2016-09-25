require('./test-shim');

/**
 * @todo resolve why this absolute replacement is necessary.
 * It seems that karma is executing in a different context (__dirname, not process.cwd()) and any
 * changes to the baseDir config seems to have no effect.
 * To resolve the issue, the solution is to use the string-replace-loader to make a replacement
 * at load-time to make the path absolute based on process.cwd() from webpack.test.ts
 *
 * This is a hack, and should be dealt with when a better solution is devised.
 */
var appContext = require.context('%working-dir%/src/browser', true, /\.spec\.ts/);
var commonContext = require.context('%working-dir%/src/common', true, /\.spec\.ts/);
appContext.keys().forEach(appContext);
commonContext.keys().forEach(commonContext);

var testing = require('@angular/core/testing');
var browser = require('@angular/platform-browser-dynamic/testing');

testing.TestBed.initTestEnvironment(
  browser.BrowserDynamicTestingModule,
  browser.platformBrowserDynamicTesting()
);