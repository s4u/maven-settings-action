const core = require('@actions/core');
const settings = require('./settings');

async function run() {

  try {
      settings.generate();
  } catch (error) {
    core.setFailed(error.message);
    console.error(error);
  }
}

run();
