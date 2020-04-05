/*
The MIT License (MIT)

Copyright (c) 2020 Slawomir Jaranowski and contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

const core = require('@actions/core');
const os = require('os');
const path = require('path');
const fs = require('fs');
const DOMParser = require('xmldom').DOMParser;
const XMLSerializer = require('xmldom').XMLSerializer;
const xpath = require('xpath');


function getSettingsPath() {
    return path.join(os.homedir(), '.m2', 'settings.xml');
}

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

function createElementWithText(template, tag, text) {
    const tagXml = template.createElement(tag);
    tagXml.textContent = text;
    return tagXml;
}

function fillServer(template, id, username, password) {

    const serverXml = template.createElement('server');

    if (!id || !username || !password) {
        core.setFailed('servers must contain id, username and password');
        return;
    }

    const idXml = createElementWithText(template, 'id', id);
    serverXml.appendChild(idXml);

    const usernameXml = createElementWithText(template, 'username', username);
    serverXml.appendChild(usernameXml);

    const passwordXml = createElementWithText(template, 'password', password);
    serverXml.appendChild(passwordXml);

    const serversXml = template.getElementsByTagName('servers')[0];
    serversXml.appendChild(serverXml);
}

function fillServers(template) {

    const servers = core.getInput('servers');

    if (!servers) {
        return;
    }

    JSON.parse(servers).forEach((server) => fillServer(template, server.id, server.username, server.password));
}

function fillMirror(template, id, name, mirrorOf, url) {

    const mirrorXml = template.createElement('mirror');

    if (!id || !name || !mirrorOf || !url) {
        core.setFailed('mirrors must contain id, name, mirrorOf and url');
        return;
    }

    const idXml = createElementWithText(template, 'id', id);
    mirrorXml.appendChild(idXml);

    const nameXml = createElementWithText(template, 'name', name);
    mirrorXml.appendChild(nameXml);

    const mirrorOfXml = createElementWithText(template, 'mirrorOf', mirrorOf);
    mirrorXml.appendChild(mirrorOfXml);

    const urlXml = createElementWithText(template, 'url', url);
    mirrorXml.appendChild(urlXml);

    const mirrorsXml = template.getElementsByTagName('mirrors')[0];
    mirrorsXml.appendChild(mirrorXml);
}

function fillMirrors(template) {

    const mirrors = core.getInput('mirrors');

    if (!mirrors) {
        return;
    }

    JSON.parse(mirrors).forEach((mirror) => fillMirror(template, mirror.id, mirror.name, mirror.mirrorOf, mirror.url));
}

function isInputTrue(inputName) {
    const val = core.getInput(inputName);
    return val && val.toLocaleLowerCase() == 'true';
}

function fillServerForGithub(templateXml) {

    if (!isInputTrue('githubServer')) {
        return;
    }

    fillServer(templateXml, 'github', '${env.GITHUB_ACTOR}', '${env.GITHUB_TOKEN}');
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
    if (isInputTrue('sonatypeSnapshots')) {
        activateProfile(template, '_sonatype-snapshots_')
    }
}

function setArtifactoryOrg(template) {
    const profileId = "_artifactory_"
    const orgname = core.getInput('artifactory_org');

    if (!orgname) {
        return;
    }

    const jfrogorgname = xpath
        .select(`/settings/profiles/profile[id[contains(text(),"${profileId}")]]/properties/jfrogorgname`, template);

    if (jfrogorgname) {
        jfrogorgname[0].textContent = orgname;
    }

    activateProfile(template, '_artifactory_')
}

function generate() {

    const settingsPath = getSettingsPath();

    core.info('Prepare maven setings: ' + settingsPath);

    if (fs.existsSync(settingsPath)) {
        if (isInputTrue('override')) {
            core.info('maven settings.xml already exists - override');
        } else {
            core.warning('maven settings.xml already exists - skip');
            return;
        }
    }

    const templateXml = getSettingsTemplate();
    fillMirrors(templateXml);
    fillServers(templateXml);
    fillServerForGithub(templateXml);
    fillProperties(templateXml);
    addSonatypeSnapshots(templateXml);
    setArtifactoryOrg(templateXml);
    writeSettings(settingsPath, templateXml);
    core.saveState('maven-settings', 'ok');
}

function cleanup() {

    const mavenSettingsState = core.getState('maven-settings');
    const settingsPath = getSettingsPath();
    if (mavenSettingsState == 'ok') {
        if (fs.existsSync(settingsPath)) {
            fs.unlinkSync(settingsPath);
            core.info('Cleanup maven setings: ' + settingsPath + ' - file was removed');
        } else {
            core.warning('Cleanup maven setings: ' + settingsPath + ' - file not exist');
        }
    } else {
        core.info('Cleanup maven setings: ' + settingsPath + ' - file wasn\'t generated by action');
    }
}

module.exports = {
    getSettingsTemplate,
    writeSettings,
    fillMirrors,
    fillServers,
    fillServerForGithub,
    fillProperties,
    addSonatypeSnapshots,
    setArtifactoryOrg,
    generate,
    cleanup
}
