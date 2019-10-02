
const DOMParser = require('xmldom').DOMParser;
const XMLSerializer = require('xmldom').XMLSerializer;
const fs = require('fs');
const path = require('path');

const settings = require('./settings');

var xmlTestProfile = undefined;

const testHomePath = fs.mkdtempSync(".m2");
const settingsPath = path.join(testHomePath, '.m2', 'settings.xml');

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

afterAll(() => {
    try {
        fs.rmdirSync(path.dirname(settingsPath));
        fs.rmdirSync(testHomePath);
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
