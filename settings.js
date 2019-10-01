const core = require('@actions/core');
const path = require('path');
const fs = require('fs');
const DOMParser = require('xmldom').DOMParser;
const XMLSerializer = require('xmldom').XMLSerializer;
const xpath = require('xpath');

function getSettingsTemplate() {
    const templatePath = path.join(__dirname, 'templates', 'settings.xml');
    const templateStr = fs.readFileSync(templatePath).toString();
    return new DOMParser().parseFromString(templateStr, 'text/xml');
}

function writeSettings(settingsPath, templateXml) {

    // create .m2 directory if not exists
    if (!fs.existsSync(path.dirname(settingsPath))) {
        fs.mkdirSync(path.dirname(settingsPath));
    }

    const settingStr = new XMLSerializer().serializeToString(templateXml);
    fs.writeFileSync(settingsPath, settingStr);
}

function fillServers(template) {

    const servers = core.getInput('servers');

    if (!servers) {
        return;
    }

    const serversXml = template.getElementsByTagName('servers')[0];

    JSON.parse(servers).forEach((server) => {

        const serverXml = template.createElement('server');
        serversXml.appendChild(serverXml);

        for (const key in server) {
            const keyXml = template.createElement(key);
            keyXml.textContent = server[key];
            serverXml.appendChild(keyXml);
        }
    });
}

function activateProfile(template, profileId) {
    const activeByDefault = xpath
        .select(`/settings/profiles/profile[id[contains(text(),"${profileId}")]]/activation/activeByDefault`, template);

    if (activeByDefault) {
        activeByDefault[0].textContent = 'true';
    }
}

function fillProperties(template) {

    const properties = core.getInput('properties');
    if (!properties) {
        return;
    }

    activateProfile(template, '_properties_')
    const propertiesXml = xpath
        .select(`/settings/profiles/profile[id[contains(text(),"_properties_")]]/properties`, template)[0];

    JSON.parse(properties).forEach((property) => {

        for (const key in property) {
            const keyXml = template.createElement(key);
            keyXml.textContent = property[key];
            propertiesXml.appendChild(keyXml);
        }
    });
}

function addSonatypeSnapshots(template) {
    const val = core.getInput('sonatypeSnapshots');
    if (val && val.toLocaleLowerCase() == 'true') {
        activateProfile(template, '_sonatype-snapshots_')
    }
}

module.exports = {
    getSettingsTemplate,
    writeSettings,
    fillServers,
    fillProperties,
    addSonatypeSnapshots
}
