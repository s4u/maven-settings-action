const core = require('@actions/core');
const path = require('path');
const fs = require('fs');
const settings = require('./settings');


// most @actions toolkit packages have async methods
async function run() {

  try {
    const settingsPath = path.join(process.env.HOME, '.m2', 'settings.xml');
    core.info('Prepare maven setings: ' +  settingsPath);

    if ( fs.existsSync(settingsPath) ) {
      core.warning('maven settings.xml already exists - skip');
      return;
    }

    const templateXml = settings.getSettingsTemplate();
    settings.fillServers(templateXml);
    settings.fillProperties(templateXml);
    settings.addSonatypeSnapshots(templateXml);
    settings.writeSettings(settingsPath, templateXml);

  } catch (error) {
    core.setFailed(error.message);
  }
}

run();

module.exports = { run };
