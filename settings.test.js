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

const os = require('os');
const process = require('process');
const DOMParser = require('xmldom').DOMParser;
const XMLSerializer = require('xmldom').XMLSerializer;
const fs = require('fs');
const path = require('path');

const settings = require('./settings');

var xmlTestProfile = undefined;

const testHomePath = fs.mkdtempSync(".m2");
const settingsPath = path.join(testHomePath, '.m2', 'settings.xml');

var consoleOutput = [];

beforeAll(() => {
    if (!fs.existsSync(testHomePath)) {
        fs.mkdirSync(testHomePath);
    }

    process.env['HOME'] = testHomePath;
    process.env['USERPROFILE'] = testHomePath;
    os.homedir = () => testHomePath;

    process.stdout.write = output => consoleOutput.push(output);
});

beforeEach(() => {
    xmlTestProfile = new DOMParser().parseFromString(`<settings>
        <profiles>
            <profile>
                <id>_properties_</id>
                <activation>
                    <activeByDefault>false</activeByDefault>
                </activation>
                <properties/>
            </profile>
            <profile>
                <id>_sonatype-snapshots_</id>
                <activation>
                    <activeByDefault>false</activeByDefault>
                </activation>
            </profile>
        </profiles>
    </settings>`);

    consoleOutput = [];
});

afterAll(() => {
    try {
        fs.rmdirSync(path.dirname(settingsPath));
    } catch (error) {
    }

    try {
        fs.rmdirSync(testHomePath);
    } catch (error) {
    }
});

afterEach(() => {

    for (key in process.env) {
        if (key.match(/^INPUT_/)) {
            delete process.env[key];
        }
    }

    try {
        fs.unlinkSync(settingsPath);
    } catch (error) {
    }
});

test('template should be read', () => {

    const template = settings.getSettingsTemplate();

    expect(template).toBeDefined();
});

test('xml should be write', () => {

    if (!fs.existsSync(testHomePath)) {
        fs.mkdirSync(testHomePath);
    }

    settings.writeSettings(settingsPath, xmlTestProfile);

    const settingsStatus = fs.lstatSync(settingsPath);
    expect(settingsStatus.isFile()).toBeTruthy();
    expect(settingsStatus.size).toBeGreaterThan(0);
});

test('fillServers do nothing if no params', () => {

    const xml = new DOMParser().parseFromString("<servers/>");

    settings.fillServers(xml);

    const xmlStr = new XMLSerializer().serializeToString(xml);

    expect(xmlStr).toBe("<servers/>");
});

test('fillServers one server', () => {

    const xml = new DOMParser().parseFromString("<servers/>");


    process.env['INPUT_SERVERS'] = '[{"id": "id1", "username": "username1", "password":"password1"}]';

    settings.fillServers(xml);

    const xmlStr = new XMLSerializer().serializeToString(xml);

    expect(xmlStr).toBe("<servers>" +
        "<server><id>id1</id><username>username1</username><password>password1</password></server>" +
        "</servers>");
});

test('fillServers two servers', () => {

    const xml = new DOMParser().parseFromString("<servers/>");

    process.env['INPUT_SERVERS'] = '[{"id": "id1", "username": "username1", "password":"password1"},\
        {"id": "id2", "username": "username2", "password":"password2"}]';

    settings.fillServers(xml);

    const xmlStr = new XMLSerializer().serializeToString(xml);

    expect(xmlStr).toBe("<servers>" +
        "<server><id>id1</id><username>username1</username><password>password1</password></server>" +
        "<server><id>id2</id><username>username2</username><password>password2</password></server>" +
        "</servers>");
});

test('addSonatypeSnapshots activate', () => {

    process.env['INPUT_SONATYPESNAPSHOTS'] = "true";

    settings.addSonatypeSnapshots(xmlTestProfile);

    const xmlStr = new XMLSerializer().serializeToString(xmlTestProfile);
    expect(xmlStr).toBe(`<settings>
        <profiles>
            <profile>
                <id>_properties_</id>
                <activation>
                    <activeByDefault>false</activeByDefault>
                </activation>
                <properties/>
            </profile>
            <profile>
                <id>_sonatype-snapshots_</id>
                <activation>
                    <activeByDefault>true</activeByDefault>
                </activation>
            </profile>
        </profiles>
    </settings>`);
});

test('fillProperties', () => {

    process.env['INPUT_PROPERTIES'] = '[{"propertyName1": "propertyValue1"}, {"propertyName2": "propertyValue2"}]';

    settings.fillProperties(xmlTestProfile);

    const xmlStr = new XMLSerializer().serializeToString(xmlTestProfile);
    expect(xmlStr).toBe(`<settings>
        <profiles>
            <profile>
                <id>_properties_</id>
                <activation>
                    <activeByDefault>true</activeByDefault>
                </activation>
                <properties><propertyName1>propertyValue1</propertyName1><propertyName2>propertyValue2</propertyName2></properties>
            </profile>
            <profile>
                <id>_sonatype-snapshots_</id>
                <activation>
                    <activeByDefault>false</activeByDefault>
                </activation>
            </profile>
        </profiles>
    </settings>`);
})

test('fillProperties do nothing if no params', () => {

    settings.fillProperties(xmlTestProfile);

    const xmlStr = new XMLSerializer().serializeToString(xmlTestProfile);
    expect(xmlStr).toBe(`<settings>
        <profiles>
            <profile>
                <id>_properties_</id>
                <activation>
                    <activeByDefault>false</activeByDefault>
                </activation>
                <properties/>
            </profile>
            <profile>
                <id>_sonatype-snapshots_</id>
                <activation>
                    <activeByDefault>false</activeByDefault>
                </activation>
            </profile>
        </profiles>
    </settings>`);
})

test('cleanup - not generated', () => {

    settings.cleanup();

    expect(consoleOutput).toEqual(
        expect.arrayContaining([
            expect.stringMatching(/Cleanup maven setings: \..+[\/\\]{1,2}\.m2[\/\\]{1,2}settings.xml - file wasn\'t generated by action/)
        ])
    );
})

test('cleanup - not exist', () => {

    process.env['STATE_maven-settings'] = 'ok';

    settings.cleanup();

    expect(consoleOutput).toEqual(
        expect.arrayContaining([
            expect.stringMatching(/::warning::Cleanup maven setings: \..+[\/\\]{1,2}\.m2[\/\\]{1,2}settings.xml - file not exist/)
        ])
    );
})

test('cleanup - ok', () => {

    process.env['STATE_maven-settings'] = 'ok';
    fs.closeSync(fs.openSync(settingsPath, 'w'));

    settings.cleanup();

    expect(consoleOutput).toEqual(
        expect.arrayContaining([
            expect.stringMatching(/Cleanup maven setings: \..+[\/\\]{1,2}\.m2[\/\\]{1,2}settings.xml - file was removed/)
        ])
    );
    expect(fs.existsSync(settingsPath)).not.toBeTruthy();
})

test('genereate', () => {

    process.env['INPUT_SERVERS'] =  '[{"id": "serverId", "username": "username", "password": "password"}]';
    process.env['INPUT_PROPERTIES'] = '[{"prop1": "value1"}, {"prop2": "value2"}]'
    process.env['INPUT_SONATYPESNAPSHOT'] = true;

    settings.generate();

    expect(consoleOutput).toEqual(
        expect.arrayContaining([
            expect.stringMatching(/Prepare maven setings: \..+[\/\\]{1,2}\.m2[\/\\]{1,2}settings.xml/),
            expect.stringMatching(/:save-state name=maven-settings::ok/)
        ])
    );
})

test('genereate - skip', () => {

    fs.closeSync(fs.openSync(settingsPath, 'w'));

    settings.generate();

    expect(consoleOutput).toEqual(
        expect.arrayContaining([
            expect.stringMatching(/Prepare maven setings: \..+[\/\\]{1,2}\.m2[\/\\]{1,2}settings.xml/),
            expect.stringMatching(/::warning::maven settings.xml already exists - skip/)
        ])
    );
})

test('genereate - override', () => {

    fs.closeSync(fs.openSync(settingsPath, 'w'));
    process.env['INPUT_OVERRIDE'] = 'true';

    settings.generate();

    expect(consoleOutput).toEqual(
        expect.arrayContaining([
            expect.stringMatching(/Prepare maven setings: \..+[\/\\]{1,2}\.m2[\/\\]{1,2}settings.xml/),
            expect.stringMatching(/maven settings.xml already exists - override/),
            expect.stringMatching(/:save-state name=maven-settings::ok/)
        ])
    );
})
