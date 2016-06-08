/**
 * This file is used by init-package-json to map the output from the initialize.js
 * prompt to the package.json file that is cloned and updated
 * @see https://github.com/npm/init-package-json for more info
 */
const responses = config.get('responses');

exports.name = responses.projectName;
exports.author = `${responses.name} <${responses.email}>`;
exports.licence = responses.license;
exports.description = responses.description;
exports.keywords = responses.keywords;
exports.version = '0.0.0';
exports.repository = responses.remote;
