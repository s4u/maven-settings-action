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

function getSettingsPath() {
    return path.join(os.homedir(), '.m2', 'settings.xml');
}

function getTemplate(templateName) {
    const templatePath = path.join(__dirname, 'templates', templateName);
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

function fillServer(templateXml, templateName, id, username, password) {

    if (!id || !username || !password) {
        core.setFailed(templateName + ' must contain id, username and password');
        return;
    }

    const serverXml = getTemplate(templateName + '.xml')
    serverXml.getElementsByTagName('id')[0].textContent = id;
    serverXml.getElementsByTagName('username')[0].textContent = username;
    serverXml.getElementsByTagName('password')[0].textContent = password;

    const serversXml = templateXml.getElementsByTagName('servers')[0];
    serversXml.appendChild(serverXml);
}

function fillServers(template, templateName) {

    const servers = core.getInput(templateName);

    if (!servers) {
        return;
    }

    JSON.parse(servers).forEach((server) => fillServer(template, templateName, server.id, server.username, server.password));
}

function fillMirror(template, id, name, mirrorOf, url) {

    if (!id || !name || !mirrorOf || !url) {
        core.setFailed('mirrors must contain id, name, mirrorOf and url');
        return;
    }

    const mirrorXml = getTemplate('mirrors.xml');
    mirrorXml.getElementsByTagName('id')[0].textContent = id;
    mirrorXml.getElementsByTagName('name')[0].textContent = name;
    mirrorXml.getElementsByTagName('mirrorOf')[0].textContent = mirrorOf;
    mirrorXml.getElementsByTagName('url')[0].textContent = url;

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

    fillServer(templateXml, 'servers', 'github', '${env.GITHUB_ACTOR}', '${env.GITHUB_TOKEN}');
}

function fillProperties(template) {

    const properties = core.getInput('properties');

    if (!properties) {
        return;
    }

    const propertiesProfileXml = getTemplate('properties.xml');
    const propertiesXml = propertiesProfileXml.getElementsByTagName('properties')[0];

    JSON.parse(properties).forEach((property) => {
        for (const key in property) {
            const keyXml = template.createElement(key);
            keyXml.textContent = property[key];
            propertiesXml.appendChild(keyXml);
        }
    });

    const profilesXml = template.getElementsByTagName('profiles')[0];
    profilesXml.appendChild(propertiesProfileXml);

}

function addProfile(template, profileName) {
    const sonatypeXml = getTemplate(profileName);
    const profilesXml = template.getElementsByTagName('profiles')[0];
    profilesXml.appendChild(sonatypeXml);
}

function addApacheSnapshots(template) {
    if (isInputTrue('apacheSnapshots')) {
        addProfile(template, 'apache-snapshot.xml')
    }
}

function addSonatypeSnapshots(template) {
    if (isInputTrue('sonatypeSnapshots')) {
        addProfile(template, 'sonatype-snapshot.xml')
    }
}

function addOracleRepo(template) {
    if (isInputTrue('oracleRepo')) {
        addProfile(template, 'oracle-repo.xml')
    }
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

    const settingsXml = getTemplate('settings.xml');
    fillMirrors(settingsXml);
    fillServers(settingsXml, 'servers');
    fillServers(settingsXml, 'oracleServers');
    fillServerForGithub(settingsXml);
    fillProperties(settingsXml);
    addApacheSnapshots(settingsXml);
    addSonatypeSnapshots(settingsXml);
    addOracleRepo(settingsXml);
    writeSettings(settingsPath, settingsXml);
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
    getTemplate,
    writeSettings,
    fillMirrors,
    fillServers,
    fillServerForGithub,
    fillProperties,
    addApacheSnapshots,
    addSonatypeSnapshots,
    addOracleRepo,
    generate,
    cleanup
}
