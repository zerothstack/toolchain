<a name="1.0.1"></a>
## [1.0.1](https://github.com/zerothstack/toolchain/compare/v1.0.0...v1.0.1) (2016-11-29)



<a name="1.0.0"></a>
# [1.0.0](https://github.com/zerothstack/toolchain/compare/v1.0.0-0...v1.0.0) (2016-11-27)


### Bug Fixes

* **Travis:** use explicit bin finding script to maybe fix travis ([974a46e](https://github.com/zerothstack/toolchain/commit/974a46e))


### Features

* **cli:** Added random filled hexagons, tidied method chain ([af95bfd](https://github.com/zerothstack/toolchain/commit/af95bfd))


### Performance Improvements

* **bootstrap:** Deferred loading until after show, added extra feedback on loading progress ([0bbd534](https://github.com/zerothstack/toolchain/commit/0bbd534))



<a name="1.0.0-0"></a>
# [1.0.0-0](https://github.com/zerothstack/toolchain/compare/2933c77...v1.0.0-0) (2016-11-23)


### Bug Fixes

* **bin:** Update bin execution to exit process when failure occurs ([32811a7](https://github.com/zerothstack/toolchain/commit/32811a7))
* **chalk:** Fixed incorrect chalk call ([d246a8a](https://github.com/zerothstack/toolchain/commit/d246a8a))
* **compile:** Temporarily suppress sourcemap output in compile ([7e4b1cd](https://github.com/zerothstack/toolchain/commit/7e4b1cd))
* **coverage:** Fixed coverage pathing ([a599357](https://github.com/zerothstack/toolchain/commit/a599357))
* **docs:** Fix doc sort order for guide collection to be collectionSort, title ([c5219ab](https://github.com/zerothstack/toolchain/commit/c5219ab))
* **init:** Add validation to initialization of project name to ensure compatibility with package.json naming conventions ([d9d0d9b](https://github.com/zerothstack/toolchain/commit/d9d0d9b))
* **initialization:** Add forced fallback when package is empty ([e1a71d1](https://github.com/zerothstack/toolchain/commit/e1a71d1))
* **initialization:** Added fallback for if the current user signature cannot be found for commit ([0dda8fe](https://github.com/zerothstack/toolchain/commit/0dda8fe))
* **initialization:** Added fallback for when the username/email can't be found ([000cfde](https://github.com/zerothstack/toolchain/commit/000cfde))
* **initialization:** Correct fallback for commit author to verify the email ([e053d58](https://github.com/zerothstack/toolchain/commit/e053d58))
* **initialization:** Fixed default for name using email default ([e8e9363](https://github.com/zerothstack/toolchain/commit/e8e9363))
* **npm:** Dropped copying of package.json into lib as it does not work with travis ci deploy pattern ([bcf7b9f](https://github.com/zerothstack/toolchain/commit/bcf7b9f))
* **npm:** fixed broken package.json ([6175b95](https://github.com/zerothstack/toolchain/commit/6175b95))
* **remote conn:** Stop server key generation prompting for password ([1ece880](https://github.com/zerothstack/toolchain/commit/1ece880))
* **test:** Fixed tests running in parallel ([0aa428f](https://github.com/zerothstack/toolchain/commit/0aa428f))
* **tests:** Fixed importing of main files into server tests, fixed css loading failing angular tests ([14d5e20](https://github.com/zerothstack/toolchain/commit/14d5e20))
* **tests:** Switched order of unified tests due to karma bug ([5b4538e](https://github.com/zerothstack/toolchain/commit/5b4538e))
* **tests:** Use absolute path to mocha bin ([cb2b441](https://github.com/zerothstack/toolchain/commit/cb2b441))
* **tsdoc:** Fix tsdoc not working with ts[@2](https://github.com/2).0.0 ([e8a228c](https://github.com/zerothstack/toolchain/commit/e8a228c))
* **upgrade:** Added babel compilation to deal with the regression in angular injector ([61f2ab1](https://github.com/zerothstack/toolchain/commit/61f2ab1))
* **upgrade:** Unified casing of test shims, removed babel transpilation hack, renamed tsconfig base to remove .all, removed testbed bootstrapping, added inclusion of common specs to server scope, ([975a2bd](https://github.com/zerothstack/toolchain/commit/975a2bd))
* **watch:** Update watch to use the dist destination ([4469b1c](https://github.com/zerothstack/toolchain/commit/4469b1c))


### Features

* **browser:** Added browser config, reconfigured to support external loading ([610a465](https://github.com/zerothstack/toolchain/commit/610a465))
* **browser:** Fixed unit test for api to ignore both main files on build ([6984374](https://github.com/zerothstack/toolchain/commit/6984374))
* **cli:** Fixed logging error when called from external, added prefer global, fixed double output of linter ([ac6388e](https://github.com/zerothstack/toolchain/commit/ac6388e))
* **cli:** Implemented initializer task, still need to start watchers on intitializer ([c0657ca](https://github.com/zerothstack/toolchain/commit/c0657ca))
* **cli:** Major refactor of the doc deployment strategy. ([08cfaf7](https://github.com/zerothstack/toolchain/commit/08cfaf7)), closes [#4](https://github.com/zerothstack/toolchain/issues/4)
* **cli:** Updated quickstart repo name ([a205836](https://github.com/zerothstack/toolchain/commit/a205836))
* **cli:** Updates to styles, fixed package author extraction, fixed issue where non module missing errors caused local fallback, added headingsidentifier metalsmith plugin, added alias for ubiquits bin ([ae64c1e](https://github.com/zerothstack/toolchain/commit/ae64c1e)), closes [#3](https://github.com/zerothstack/toolchain/issues/3)
* **connection:** Implement basic remote connection passthrough of credentials, add option to skip browser compilation, ([9dfd210](https://github.com/zerothstack/toolchain/commit/9dfd210))
* **coverage:** Added coveralls task ([c8f9224](https://github.com/zerothstack/toolchain/commit/c8f9224))
* **crypto:** Completed implementation of password prompting for key generation and jwt signing ([0acdadd](https://github.com/zerothstack/toolchain/commit/0acdadd))
* **crypto:** Implement key generation and jwt signing ([b965d16](https://github.com/zerothstack/toolchain/commit/b965d16))
* **crypto:** Implemented passthrough of jwt for authentication, added key generation to the quickstart tour ([fe10440](https://github.com/zerothstack/toolchain/commit/fe10440))
* **deploy:** Broke down the deploy script into slightly smaller components ([621efd6](https://github.com/zerothstack/toolchain/commit/621efd6))
* **deployment:** reordered deployment script so paths are correct ([cc43a8e](https://github.com/zerothstack/toolchain/commit/cc43a8e))
* **docs:** Add drafts plugin ([fbba3a0](https://github.com/zerothstack/toolchain/commit/fbba3a0))
* **docs:** Added check to only include the livereload plugin if in watch mode. ([11d2f73](https://github.com/zerothstack/toolchain/commit/11d2f73)), closes [#6](https://github.com/zerothstack/toolchain/issues/6)
* **docs:** Made metalsmith port configurable, updates to the templates and styling for docs ([8be63a3](https://github.com/zerothstack/toolchain/commit/8be63a3))
* **docs:** Updated docs template for news articles ([0e13b45](https://github.com/zerothstack/toolchain/commit/0e13b45))
* **documentation:** adds documentation deployment script ([a95ec56](https://github.com/zerothstack/toolchain/commit/a95ec56))
* **documentation:** dropped api, implemented new layout with custom handlebars helpers ([06adfb6](https://github.com/zerothstack/toolchain/commit/06adfb6))
* **documentation:** Implemented metalsmith build process for docs ([fa2e556](https://github.com/zerothstack/toolchain/commit/fa2e556))
* **documentation:** implemented non overwriting of assets ([c4949c7](https://github.com/zerothstack/toolchain/commit/c4949c7))
* **documentation:** re-added api with _blank targets for externals, implemented metalsmith define, date formatter & headings, updated theme ([1b7d252](https://github.com/zerothstack/toolchain/commit/1b7d252))
* **documentation:** Updated paths to source from config, refactored to .hbs extension, added typedoc default theme ([bb0b4e6](https://github.com/zerothstack/toolchain/commit/bb0b4e6))
* **exceptions:** Added source mapping support for api exception stacktracing ([6787443](https://github.com/zerothstack/toolchain/commit/6787443))
* **gitter:** Add gitter sidecar support ([df23d46](https://github.com/zerothstack/toolchain/commit/df23d46))
* **infrastructure:** Implemented live reloading ([286776f](https://github.com/zerothstack/toolchain/commit/286776f))
* **infrastructure:** Refactored to output es6 modules and separate lib from dist for package management, fixed nodemon not working without gulpfile ([1b1cbe8](https://github.com/zerothstack/toolchain/commit/1b1cbe8))
* **infrastructure:** Removed complilation of _demo, renamed api to server and nested source in src dir ([f4dbb9b](https://github.com/zerothstack/toolchain/commit/f4dbb9b))
* **npm:** Added copying of package.json to lib so it can be published from there ([5d802ea](https://github.com/zerothstack/toolchain/commit/5d802ea))
* **npm:** Added package.json ([2933c77](https://github.com/zerothstack/toolchain/commit/2933c77))
* **remote conn:** Add ability for tour to skip, pass through terminal column width to server ([642ddd2](https://github.com/zerothstack/toolchain/commit/642ddd2))
* **tour:** Implement basic tour to familiarize users ([c6b1b85](https://github.com/zerothstack/toolchain/commit/c6b1b85))
* **travis:** Add custom chrome flags for travis to use ([a8b5cb6](https://github.com/zerothstack/toolchain/commit/a8b5cb6))
* **typescript:** Updated to typescript 2.0, fixed number of issues with build ([fa2c256](https://github.com/zerothstack/toolchain/commit/fa2c256))
* **watcher:** Add env flag to force nodemon to allow color output ([4bd2ea5](https://github.com/zerothstack/toolchain/commit/4bd2ea5))



