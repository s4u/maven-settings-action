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
const DOMParser = require('@xmldom/xmldom').DOMParser;
const XMLSerializer = require('@xmldom/xmldom').XMLSerializer;
const fs = require('fs');
const path = require('path');

const settings = require('./settings');

var xmlTestProfile = undefined;

const testHomePath = fs.mkdtempSync(".m2");
const settingsPath = path.join(testHomePath, '.m2', 'settings.xml');

var consoleOutput = [];

function stringAsXml(str) {
    return new DOMParser().parseFromString(str, 'text/xml');
}

function xmlAsString(xml) {
    return new XMLSerializer().serializeToString(xml).replace(/^\s*$(?:\r\n?|\n)/gm, '');
}

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
    xmlTestProfile = stringAsXml(`<settings>
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
        if (key.match(/^INPUT_/) || key.match(/^GITHUB_/)) {
            delete process.env[key];
        }
    }

    try {
        fs.unlinkSync(settingsPath);
    } catch (error) {
    }
});

test('template should be read', () => {
    const template = settings.getTemplate('settings.xml');

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

    const xml = stringAsXml("<servers/>");

    settings.fillServers(xml, 'servers');

    const xmlStr = new XMLSerializer().serializeToString(xml);

    expect(xmlStr).toBe("<servers/>");
});

test('fillServers one server', () => {

    const xml = stringAsXml("<servers/>");

    process.env['INPUT_SERVERS'] = '[{"id": "id1", "username": "username1", "password":"password1"}]';

    settings.fillServers(xml, 'servers');

    expect(xmlAsString(xml)).toBe(`<servers>
<server>
    <id>id1</id>
    <username>username1</username>
    <password>password1</password>
</server></servers>`);

});

test('fillServers with username and configuration', () => {

    const xml = stringAsXml("<servers/>");

    process.env['INPUT_SERVERS'] = '[{"id": "id1", "username": "username", "configuration": {"prop1": "prop1Value", "prop2": "prop2Value"}}]';

    settings.fillServers(xml, 'servers');

    expect(xmlAsString(xml)).toBe(`<servers>
<server>
    <id>id1</id>
    <username>username</username>
    <configuration><prop1>prop1Value</prop1><prop2>prop2Value</prop2></configuration>
</server></servers>`);
});

test('fillServers with username, password and configuration', () => {

    const xml = stringAsXml("<servers/>");

    process.env['INPUT_SERVERS'] = '[{"id": "id1", "username": "username", "password": "password", "configuration": {"prop1": "prop1Value", "prop2": "prop2Value"}}]';

    settings.fillServers(xml, 'servers');

    expect(xmlAsString(xml)).toBe(`<servers>
<server>
    <id>id1</id>
    <username>username</username>
    <password>password</password>
    <configuration><prop1>prop1Value</prop1><prop2>prop2Value</prop2></configuration>
</server></servers>`);
});

test('fillServers with username, privateKey', () => {

    const xml = stringAsXml("<servers/>");

    process.env['INPUT_SERVERS'] = '[{"id": "id1", "username": "username", "privateKey": "${user.home}/.ssh/id_rsa"}]';

    settings.fillServers(xml, 'servers');

    expect(xmlAsString(xml)).toBe(`<servers>
<server>
    <id>id1</id>
    <username>username</username>
    <privateKey>\${user.home}/.ssh/id_rsa</privateKey>
</server></servers>`);
});

test('fillServers with username, privateKey, and passphrase', () => {

    const xml = stringAsXml("<servers/>");

    process.env['INPUT_SERVERS'] = '[{"id": "id1", "username": "username", "privateKey": "${user.home}/.ssh/id_rsa", "passphrase": "secret"}]';

    settings.fillServers(xml, 'servers');

    expect(xmlAsString(xml)).toBe(`<servers>
<server>
    <id>id1</id>
    <username>username</username>
    <privateKey>\${user.home}/.ssh/id_rsa</privateKey>
    <passphrase>secret</passphrase>
</server></servers>`);
});

test('fillServers with all attributes', () => {

    const xml = stringAsXml("<servers/>");

    process.env['INPUT_SERVERS'] = '[{"id": "server001", "username": "my_login", "password": "my_password", "privateKey": "${user.home}/.ssh/id_dsa", "passphrase": "some_passphrase", "filePermissions": "664", "directoryPermissions": "775", "configuration": {"prop1": "prop1Value", "prop2": "prop2Value"} }]';

    settings.fillServers(xml, 'servers');

    expect(xmlAsString(xml)).toBe(`<servers>
<server>
    <id>server001</id>
    <username>my_login</username>
    <password>my_password</password>
    <privateKey>\${user.home}/.ssh/id_dsa</privateKey>
    <passphrase>some_passphrase</passphrase>
    <filePermissions>664</filePermissions>
    <directoryPermissions>775</directoryPermissions>
    <configuration><prop1>prop1Value</prop1><prop2>prop2Value</prop2></configuration>
</server></servers>`);
});

test('fillServers with configuration', () => {

    const xml = stringAsXml("<servers/>");

    process.env['INPUT_SERVERS'] = '[{"id": "id1", "configuration": {"prop1": "prop1Value", "prop2": "prop2Value"}}]';

    settings.fillServers(xml, 'servers');

    expect(xmlAsString(xml)).toBe(`<servers>
<server>
    <id>id1</id>
    <configuration><prop1>prop1Value</prop1><prop2>prop2Value</prop2></configuration>
</server></servers>`);
});

test('fillServers with configuration subLevel', () => {

    const xml = stringAsXml("<servers/>");

    process.env['INPUT_SERVERS'] = '[{"id": "id1", "configuration": {"prop1": {"prop11": "value11", "prop12": "value12"}, "prop2": "value2"}}]';

    settings.fillServers(xml, 'servers');

    expect(xmlAsString(xml)).toBe(`<servers>
<server>
    <id>id1</id>
    <configuration><prop1><prop11>value11</prop11><prop12>value12</prop12></prop1><prop2>value2</prop2></configuration>
</server></servers>`);
});

test('fillServers two servers', () => {

    const xml = stringAsXml("<servers/>");

    process.env['INPUT_SERVERS'] = '[{"id": "id1", "username": "username1", "password":"password1"},\
        {"id": "id2", "username": "username2", "password":"password2"}]';

    settings.fillServers(xml, 'servers');

    expect(xmlAsString(xml)).toBe(`<servers>
<server>
    <id>id1</id>
    <username>username1</username>
    <password>password1</password>
</server>
<server>
    <id>id2</id>
    <username>username2</username>
    <password>password2</password>
</server></servers>`);
});

test('fill servers incorrect fields', () => {

    const xml = stringAsXml("<servers/>");

    process.env['INPUT_SERVERS'] = '[{"idx": "id1"}]';

    settings.fillServers(xml, 'servers');

    const xmlStr = new XMLSerializer().serializeToString(xml);

    expect(xmlStr).toBe('<servers/>');
    expect(consoleOutput).toEqual(
        expect.arrayContaining([
            expect.stringMatching(/::error::servers must contain id, and username or configuration/)
        ])
    );
});

test('fill oracleServers', () => {

    const xml = stringAsXml("<servers/>");

    process.env['INPUT_ORACLESERVERS'] = '[{"id": "id1", "username": "username1", "password":"password1"}]';

    settings.fillServers(xml, 'oracleServers');

    expect(xmlAsString(xml)).toBe(`<servers>
<server>
    <id>id1</id>
    <username>username1</username>
    <password>password1</password>
    <configuration>
        <basicAuthScope>
            <host>ANY</host>
            <port>ANY</port>
            <realm>OAM 11g</realm>
        </basicAuthScope>
        <httpConfiguration>
            <all>
                <params>
                    <property>
                        <name>http.protocol.allow-circular-redirects</name>
                        <value>%b,true</value>
                    </property>
                </params>
            </all>
        </httpConfiguration>
    </configuration>
</server></servers>`);
});

test('fillServers github', () => {

    const xml = stringAsXml("<servers/>");

    process.env['INPUT_GITHUBSERVER'] = 'true';

    settings.fillServerForGithub(xml);

    expect(xmlAsString(xml)).toBe(`<servers>
<server>
    <id>github</id>
    <username>\${env.GITHUB_ACTOR}</username>
    <password>\${env.GITHUB_TOKEN}</password>
</server></servers>`);
    expect(consoleOutput).toEqual([]);
});

test('fillMirrors do nothing if no params', () => {

    const xml = stringAsXml("<mirrors/>");

    settings.fillMirrors(xml);

    const xmlStr = new XMLSerializer().serializeToString(xml);

    expect(xmlStr).toBe("<mirrors/>");
    expect(consoleOutput).toEqual([]);
});

test('fillMirrors one mirror', () => {

    const xml = stringAsXml("<mirrors/>");

    process.env['INPUT_MIRRORS'] = '[{"id": "id1", "name": "name", "mirrorOf":"mirrorOf", "url":"url"}]';

    settings.fillMirrors(xml);

    const xmlStr = new XMLSerializer().serializeToString(xml);

    expect(xmlStr).toBe(`<mirrors>
<mirror>
    <id>id1</id>
    <name>name</name>
    <mirrorOf>mirrorOf</mirrorOf>
    <url>url</url>
</mirror></mirrors>`);
    expect(consoleOutput).toEqual([]);
});

test('fillMirrors two mirrors', () => {

    const xml = stringAsXml("<mirrors/>");

    process.env['INPUT_MIRRORS'] = '[{"id": "id1", "name": "name1", "mirrorOf":"mirrorOf1", "url":"url1"},{"id": "id2", "name": "name2", "mirrorOf":"mirrorOf2", "url":"url2"}]';

    settings.fillMirrors(xml);

    const xmlStr = new XMLSerializer().serializeToString(xml);

    expect(xmlStr).toBe(`<mirrors>
<mirror>
    <id>id1</id>
    <name>name1</name>
    <mirrorOf>mirrorOf1</mirrorOf>
    <url>url1</url>
</mirror>
<mirror>
    <id>id2</id>
    <name>name2</name>
    <mirrorOf>mirrorOf2</mirrorOf>
    <url>url2</url>
</mirror></mirrors>`);
    expect(consoleOutput).toEqual([]);
});

test('fillMirrors incorrect fields', () => {

    const xml = stringAsXml("<mirrors/>");

    process.env['INPUT_MIRRORS'] = '[{"idx": "id1"}]';

    settings.fillMirrors(xml);

    const xmlStr = new XMLSerializer().serializeToString(xml);

    expect(xmlStr).toBe('<mirrors/>');
    expect(consoleOutput).toEqual(
        expect.arrayContaining([
            expect.stringMatching(/::error::mirrors must contain id, name, mirrorOf and url/)
        ])
    );
});

test("fillProxies do noting if no params", () => {
    const xml = stringAsXml("<proxies/>");

    settings.fillProxies(xml);

    const xmlStr = new XMLSerializer().serializeToString(xml);
    expect(xmlStr).toBe("<proxies/>");
    expect(consoleOutput).toEqual([]);
})

test("fillProxies one proxy", () => {
    const xml = stringAsXml("<proxies/>");

    process.env['INPUT_PROXIES'] = `[{"id": "proxyId", "active": "isActive", "protocol": "proxyProtocol",
     "host": "proxyHost", "port": "proxyPort", "nonProxyHosts": "nonProxyHost"}]`;
    
    settings.fillProxies(xml);

    const xmlStr = new XMLSerializer().serializeToString(xml);
    expect(xmlStr).toBe(`<proxies><proxy>
    <id>proxyId</id>
    <active>isActive</active>
    <protocol>proxyProtocol</protocol>
    <host>proxyHost</host>
    <port>proxyPort</port>
    <nonProxyHosts>nonProxyHost</nonProxyHosts>
</proxy></proxies>`)

})

test("fillProxies two proxies", () => {
    const xml = stringAsXml("<proxies/>");

    process.env['INPUT_PROXIES'] = `[{"id": "proxyId1", "active": "isActive1", "protocol": "proxyProtocol1", 
    "host": "proxyHost1", "port": "proxyPort1", "nonProxyHosts": "nonProxyHost1"}, 
    {"id": "proxyId2", "active": "isActive2", "protocol": "proxyProtocol2",
    "host": "proxyHost2", "port": "proxyPort2", "nonProxyHosts": "nonProxyHost2"}]`;

    settings.fillProxies(xml);

    const xmlStr = new XMLSerializer().serializeToString(xml);
    expect(xmlStr).toBe(`<proxies><proxy>
    <id>proxyId1</id>
    <active>isActive1</active>
    <protocol>proxyProtocol1</protocol>
    <host>proxyHost1</host>
    <port>proxyPort1</port>
    <nonProxyHosts>nonProxyHost1</nonProxyHosts>
</proxy><proxy>
    <id>proxyId2</id>
    <active>isActive2</active>
    <protocol>proxyProtocol2</protocol>
    <host>proxyHost2</host>
    <port>proxyPort2</port>
    <nonProxyHosts>nonProxyHost2</nonProxyHosts>
</proxy></proxies>`)

})

test('fillProxies incorrect fields', () => {

    const xml = stringAsXml("<proxies/>");

    process.env['INPUT_PROXIES'] = '[{"idx": "id1"}]';

    settings.fillProxies(xml);

    const xmlStr = new XMLSerializer().serializeToString(xml);

    expect(xmlStr).toBe('<proxies/>');
    expect(consoleOutput).toEqual(
        expect.arrayContaining([
            expect.stringMatching(/::error::proxies must contain id, active, protocol, host, port and nonProxyHosts/)
        ])
    );
})

test('addApacheSnapshots', () => {

    process.env['INPUT_APACHESNAPSHOTS'] = "true";

    const xml = stringAsXml('<profiles/>');

    settings.addApacheSnapshots(xml);

    const xmlStr = new XMLSerializer().serializeToString(xml);
    expect(xmlStr).toBe(`<profiles>
<profile>
    <id>_apache-snapshots_</id>
    <activation>
        <activeByDefault>true</activeByDefault>
    </activation>
    <repositories>
        <repository>
            <id>apache.snapshots.https</id>
            <url>https://repository.apache.org/snapshots/</url>
            <releases>
                <enabled>false</enabled>
            </releases>
            <snapshots>
                <enabled>true</enabled>
            </snapshots>
        </repository>
    </repositories>
    <pluginRepositories>
        <pluginRepository>
            <id>apache.snapshots.https</id>
            <url>https://repository.apache.org/snapshots/</url>
            <releases>
                <enabled>false</enabled>
            </releases>
            <snapshots>
                <enabled>true</enabled>
            </snapshots>
        </pluginRepository>
    </pluginRepositories>
</profile></profiles>`);
});

test('addSonatypeSnapshots', () => {

    process.env['INPUT_SONATYPESNAPSHOTS'] = "true";

    const xml = stringAsXml('<profiles/>');

    settings.addSonatypeSnapshots(xml);

    const xmlStr = new XMLSerializer().serializeToString(xml);
    expect(xmlStr).toBe(`<profiles>
<profile>
    <id>_sonatype-snapshots_</id>
    <activation>
        <activeByDefault>true</activeByDefault>
    </activation>
    <repositories>
        <repository>
            <id>sonatype-snapshots</id>
            <url>https://oss.sonatype.org/content/repositories/snapshots</url>
            <releases>
                <enabled>false</enabled>
            </releases>
            <snapshots>
                <enabled>true</enabled>
            </snapshots>
        </repository>
        <repository>
            <id>ossrh</id>
            <url>https://s01.oss.sonatype.org/content/repositories/snapshots</url>
            <releases>
                <enabled>false</enabled>
            </releases>
            <snapshots>
                <enabled>true</enabled>
            </snapshots>
        </repository>
    </repositories>
    <pluginRepositories>
        <pluginRepository>
            <id>sonatype-snapshots</id>
            <url>https://oss.sonatype.org/content/repositories/snapshots</url>
            <releases>
                <enabled>false</enabled>
            </releases>
            <snapshots>
                <enabled>true</enabled>
            </snapshots>
        </pluginRepository>
        <pluginRepository>
            <id>ossrh</id>
            <url>https://s01.oss.sonatype.org/content/repositories/snapshots</url>
            <releases>
                <enabled>false</enabled>
            </releases>
            <snapshots>
                <enabled>true</enabled>
            </snapshots>
        </pluginRepository>
    </pluginRepositories>
</profile></profiles>`);
});

test('addOracleRepo', () => {

    process.env['INPUT_ORACLEREPO'] = "true";

    const xml = stringAsXml('<profiles/>');

    settings.addOracleRepo(xml);

    const xmlStr = new XMLSerializer().serializeToString(xml);
    expect(xmlStr).toBe(`<profiles>
<profile>
    <id>_maven.oracle.com_</id>
    <activation>
        <activeByDefault>true</activeByDefault>
    </activation>
    <repositories>
        <repository>
            <id>maven.oracle.com</id>
            <url>https://maven.oracle.com</url>
            <releases>
                <enabled>true</enabled>
            </releases>
            <snapshots>
                <enabled>false</enabled>
            </snapshots>
        </repository>
    </repositories>
    <pluginRepositories>
        <pluginRepository>
            <id>maven.oracle.com</id>
            <url>https://maven.oracle.com</url>
            <releases>
                <enabled>true</enabled>
            </releases>
            <snapshots>
                <enabled>false</enabled>
            </snapshots>
        </pluginRepository>
    </pluginRepositories>
</profile></profiles>`);
});

test('fillProperties', () => {

    process.env['INPUT_PROPERTIES'] = '[{"propertyName1": "propertyValue1"}, {"propertyName2": "propertyValue2"}]';

    const xml = stringAsXml('<profiles/>');

    settings.fillProperties(xml);

    const xmlStr = new XMLSerializer().serializeToString(xml);
    expect(xmlStr).toBe(`<profiles>
<profile>
    <id>_properties_</id>
    <activation>
        <activeByDefault>true</activeByDefault>
    </activation>
    <properties><propertyName1>propertyValue1</propertyName1><propertyName2>propertyValue2</propertyName2></properties>
</profile></profiles>`);
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
            expect.stringMatching(/Cleanup maven settings: \..+[\/\\]{1,2}\.m2[\/\\]{1,2}settings.xml - file wasn\'t generated by action/)
        ])
    );
})

test('cleanup - not exist', () => {

    process.env['STATE_maven-settings'] = 'ok';

    settings.cleanup();

    expect(consoleOutput).toEqual(
        expect.arrayContaining([
            expect.stringMatching(/::warning::Cleanup maven settings: \..+[\/\\]{1,2}\.m2[\/\\]{1,2}settings.xml - file not exist/)
        ])
    );
})

test('cleanup - ok', () => {

    process.env['STATE_maven-settings'] = 'ok';
    fs.closeSync(fs.openSync(settingsPath, 'w'));

    settings.cleanup();

    expect(consoleOutput).toEqual(
        expect.arrayContaining([
            expect.stringMatching(/Cleanup maven settings: \..+[\/\\]{1,2}\.m2[\/\\]{1,2}settings.xml - file was removed/)
        ])
    );
    expect(fs.existsSync(settingsPath)).not.toBeTruthy();
})

test('generate', () => {

    process.env['INPUT_SERVERS'] = '[{"id": "serverId", "username": "username", "password": "password"}]';
    process.env['INPUT_PROPERTIES'] = '[{"prop1": "value1"}, {"prop2": "value2"}]'
    process.env['INPUT_SONATYPESNAPSHOT'] = true;

    settings.generate();

    expect(consoleOutput).toEqual(
        expect.arrayContaining([
            expect.stringMatching(/Prepare maven settings: \..+[\/\\]{1,2}\.m2[\/\\]{1,2}settings.xml/),
            expect.stringMatching(/:save-state name=maven-settings::ok/)
        ])
    );
})

test('generate - skip', () => {

    fs.closeSync(fs.openSync(settingsPath, 'w'));

    settings.generate();

    expect(consoleOutput).toEqual(
        expect.arrayContaining([
            expect.stringMatching(/Prepare maven settings: \..+[\/\\]{1,2}\.m2[\/\\]{1,2}settings.xml/),
            expect.stringMatching(/::warning::maven settings.xml already exists - skip/)
        ])
    );
})

test('generate - override', () => {

    fs.closeSync(fs.openSync(settingsPath, 'w'));
    process.env['INPUT_OVERRIDE'] = 'true';

    settings.generate();

    expect(consoleOutput).toEqual(
        expect.arrayContaining([
            expect.stringMatching(/Prepare maven settings: \..+[\/\\]{1,2}\.m2[\/\\]{1,2}settings.xml/),
            expect.stringMatching(/maven settings.xml already exists - override/),
            expect.stringMatching(/:save-state name=maven-settings::ok/)
        ])
    );
})

test('generate - custom path', () => {

    if (!fs.existsSync(testHomePath)) {
        fs.mkdirSync(testHomePath);
    }

    const mySettings =  path.join(testHomePath, 'settings_custom.xml');
    process.env['INPUT_PATH'] = mySettings;
    settings.generate();

    const settingsStatus = fs.lstatSync(mySettings);
    expect(settingsStatus.isFile()).toBeTruthy();
    expect(settingsStatus.size).toBeGreaterThan(0);
});

test('addCustomRepositories - one with snapshots one without', () => {

    process.env['INPUT_REPOSITORIES'] = '[{"id":"repoId","name":"repoName","url":"url","snapshots":{"enabled":true}},{"id":"repoId2","url":"url2"}]'

    const xml = stringAsXml('<profiles/>');

    settings.fillRepositories(xml,'repositories');

    const xmlStr = new XMLSerializer().serializeToString(xml);
    expect(xmlStr).toBe(`<profiles>
<profile>
    <id>_custom_repositories_</id>
    <activation>
        <activeByDefault>true</activeByDefault>
    </activation>
    <repositories> <repository>
     <id>repoId</id>
     <name>repoName</name>
     <url>url</url>
     <snapshots><enabled>true</enabled></snapshots>
 </repository> <repository>
     <id>repoId2</id>
     
     <url>url2</url>
     
 </repository></repositories>
    <pluginRepositories/>
</profile></profiles>`);
});

test('addCustomRepositories - fail if url is missing', () => {

    process.env['INPUT_REPOSITORIES'] = '[{"id":"repoId","name":"repoName"}]'

    const xml = stringAsXml('<profiles/>');

    settings.fillRepositories(xml,'repositories');

    const xmlStr = new XMLSerializer().serializeToString(xml);

    expect(xmlStr).toBe(`<profiles>
<profile>
    <id>_custom_repositories_</id>
    <activation>
        <activeByDefault>true</activeByDefault>
    </activation>
    <repositories/>
    <pluginRepositories/>
</profile></profiles>`);
    expect(consoleOutput).toEqual(
      expect.arrayContaining([
          expect.stringMatching(/::error::repositories must contain id and url/)
      ])
    );
});