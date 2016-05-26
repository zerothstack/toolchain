Error.stackTraceLimit = Infinity;

require('core-js');

require('reflect-metadata');
require('zone.js/dist/zone');
require('zone.js/dist/long-stack-trace-zone');
require('zone.js/dist/jasmine-patch');

require('zone.js/dist/async-test');
/**
 * @todo resolve why this absolute replacement is necessary.
 * It seems that karma is exectuting in a different context (__dirname, not process.cwd()) and any
 * changes to the baseDir config seems to have no effect.
 * To resolve the issue, the solution is to use the string-replace-loader to make a replacement
 * at load-time to make the path absolute based on process.cwd() from webpack.test.ts
 *
 * This is a hack, and should be dealt with when a better solution is devised.
 */
var appContext = require.context('%working-dir%/src/browser', true, /\.spec\.ts/);
appContext.keys().forEach(appContext);

var testing = require('@angular/core/testing');
var browser = require('@angular/platform-browser-dynamic/testing');

testing.setBaseTestProviders(
  browser.TEST_BROWSER_DYNAMIC_PLATFORM_PROVIDERS,
  browser.TEST_BROWSER_DYNAMIC_APPLICATION_PROVIDERS
);
