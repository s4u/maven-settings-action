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
const DOMParser = require('@xmldom/xmldom').DOMParser;
const XMLSerializer = require('@xmldom/xmldom').XMLSerializer;

function getSettingsPath() {
    const _path = core.getInput('path');
    if (!_path) {
        return path.join(os.homedir(), '.m2', 'settings.xml');
    } else {
        return _path;
    }
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

function jsonToXml(templateXml, xmlTag, json) {
    for (const key in json) {
        const keyXml = templateXml.createElement(key);
        const value = json[key];
        if (value instanceof Object) {
            jsonToXml(templateXml, keyXml, value);
        } else {
            keyXml.textContent = value;
        }
        xmlTag.appendChild(keyXml);
    }
}

function fillServer(templateXml, templateName, id, username, password, privateKey, passphrase, filePermissions, directoryPermissions, configurations) {

    if (!id || (!username && !configurations)) {
        core.setFailed(templateName + ' must contain id, and username or configuration');
        return;
    }

    const serverXml = getTemplate(templateName + '.xml')
    serverXml.getElementsByTagName('id')[0].textContent = id;

    const serverTags = {
        'username': username,
        'password': password,
        'privateKey': privateKey,
        'passphrase': passphrase,
        'filePermissions': filePermissions,
        'directoryPermissions': directoryPermissions
    };
    for (const tag in serverTags) {
        const serverTag = serverXml.getElementsByTagName(tag)[0];
        const tagValue = serverTags[tag];
        if (tagValue) {
            serverTag.textContent = tagValue;
        } else {
            serverXml.documentElement.removeChild(serverTag);
        }
    }

    const configurationTag = serverXml.getElementsByTagName('configuration')[0];
    if (configurations) {
        jsonToXml(templateXml, configurationTag, configurations);
    } else {
        if (configurationTag.childNodes.length == 0) {
            serverXml.documentElement.removeChild(configurationTag);
        }
    }

    const serversXml = templateXml.getElementsByTagName('servers')[0];
    serversXml.appendChild(serverXml);
}

function fillServers(template, templateName) {

    const servers = core.getInput(templateName);

    if (!servers) {
        return;
    }

    JSON.parse(servers).forEach((server) =>
        fillServer(template, templateName, server.id, server.username,
            server.password, server.privateKey, server.passphrase,
            server.filePermissions, server.directoryPermissions,
            server.configuration));
}

function fillRepository(templateXml, templateName, id, name, url, snapshots) {

    if (!id || !url) {
        core.setFailed(templateName + ' must contain id and url');
        return;
    }

    const repositoryXml = getTemplate(templateName + '.xml')
    repositoryXml.getElementsByTagName('id')[0].textContent = id;

    const repositoryTags = {
        'name': name,
        'url': url
    };
    for (const tag in repositoryTags) {
        const repositoryTag = repositoryXml.getElementsByTagName(tag)[0];
        const tagValue = repositoryTags[tag];
        if (tagValue) {
            repositoryTag.textContent = tagValue;
        } else {
            repositoryXml.documentElement.removeChild(repositoryTag);
        }
    }

    const snapshotsTag = repositoryXml.getElementsByTagName('snapshots')[0];
    if (snapshots) {
        jsonToXml(templateXml, snapshotsTag, snapshots);
    } else {
        repositoryXml.documentElement.removeChild(snapshotsTag);
    }

    const repositoriesXml = templateXml.getElementsByTagName('repositories')[0];
    repositoriesXml.appendChild(repositoryXml);
}

function fillRepositories(template, templateName) {

    const repositories = core.getInput(templateName);

    if (!repositories) {
        return;
    }


    const customRepositoriesTemplate = getTemplate('custom-repositories.xml');
    const profilesXml = template.getElementsByTagName('profiles')[0];
    profilesXml.appendChild(customRepositoriesTemplate);

    JSON.parse(repositories).forEach((repository) =>
      fillRepository(customRepositoriesTemplate, templateName, repository.id, repository.name, repository.url,
        repository.snapshots));
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

function fillProxies(template) {
    
    const proxies = core.getInput('proxies');

    if (!proxies) {
        return;
    }

    JSON.parse(proxies).forEach((proxy) => fillProxy(template, proxy.id, proxy.active, proxy.protocol, proxy.host, proxy.port, proxy.nonProxyHosts));
}

function fillProxy(template, id, active, protocol, host, port, nonProxyHosts) {
    if(!id || !active || !protocol || !host || !port || !nonProxyHosts) {
        core.setFailed('proxies must contain id, active, protocol, host, port and nonProxyHosts');
        return;
    }

    const proxyXml = getTemplate('proxy.xml');
    proxyXml.getElementsByTagName("id")[0].textContent = id;
    proxyXml.getElementsByTagName("active")[0].textContent = active;
    proxyXml.getElementsByTagName("protocol")[0].textContent = protocol;
    proxyXml.getElementsByTagName("host")[0].textContent = host;
    proxyXml.getElementsByTagName("port")[0].textContent = port;
    proxyXml.getElementsByTagName("nonProxyHosts")[0].textContent = nonProxyHosts;

    const proxiesXml = template.getElementsByTagName('proxies')[0];
    proxiesXml.appendChild(proxyXml);
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

    core.info('Prepare maven settings: ' + settingsPath);

    if (fs.existsSync(settingsPath)) {
        if (isInputTrue('override')) {
            core.info('maven settings.xml already exists - override');
        } else {
            core.warning('maven settings.xml already exists - skip');
            return;
        }
    }

    const settingsXml = getTemplate('settings.xml');
    fillProxies(settingsXml);
    fillMirrors(settingsXml);
    fillServers(settingsXml, 'servers');
    fillServers(settingsXml, 'oracleServers');
    fillServerForGithub(settingsXml);
    fillProperties(settingsXml);
    addApacheSnapshots(settingsXml);
    addSonatypeSnapshots(settingsXml);
    addOracleRepo(settingsXml);
    fillRepositories(settingsXml,'repositories')
    writeSettings(settingsPath, settingsXml);
    core.saveState('maven-settings', 'ok');
}

function cleanup() {

    const mavenSettingsState = core.getState('maven-settings');
    const settingsPath = getSettingsPath();
    if (mavenSettingsState == 'ok') {
        if (fs.existsSync(settingsPath)) {
            fs.unlinkSync(settingsPath);
            core.info('Cleanup maven settings: ' + settingsPath + ' - file was removed');
        } else {
            core.warning('Cleanup maven settings: ' + settingsPath + ' - file not exist');
        }
    } else {
        core.info('Cleanup maven settings: ' + settingsPath + ' - file wasn\'t generated by action');
    }
}

module.exports = {
    getTemplate,
    writeSettings,
    fillMirrors,
    fillServers,
    fillProxies,
    fillServerForGithub,
    fillProperties,
    fillRepositories,
    addApacheSnapshots,
    addSonatypeSnapshots,
    addOracleRepo,
    generate,
    cleanup
}
