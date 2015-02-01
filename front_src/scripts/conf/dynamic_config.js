// Configuration for the dynamic.js module. Since some prototypes are
// instantiated in the app.js and also in the module itself later on,
// I saved the configuration, so that I don't have to update it at two
// different if changes were needed.
// To experiment, just change one of the values from true to false.
module.exports = {
    allowAddSibling: true,
    allowAddEmbedded: true
};
