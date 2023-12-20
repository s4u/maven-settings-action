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

const process = require('process');
const cp = require('child_process');
const path = require('path');
const fs = require('fs');

const testHomePath = fs.mkdtempSync(".m2");
const settingsPath = path.join(testHomePath, '.m2', 'settings.xml');
const indexPath = path.join(__dirname, 'index.js');

beforeAll(() => {
    if (!fs.existsSync(testHomePath)) {
        fs.mkdirSync(testHomePath);
    }

    process.env['HOME'] = testHomePath;
    process.env['USERPROFILE'] = testHomePath;
});

afterEach(() => {
    try {
        fs.unlinkSync(settingsPath);
    } catch (error) {
    }
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


test('run with all feature', () => {

    process.env['INPUT_SERVERS'] = '[{"id": "serverId", "username": "sUsername", "password": "sPassword", "configuration": {"props1": "value1"}}]';
    process.env['INPUT_ORACLESERVERS'] = '[{"id": "oServerId", "username": "oUsername", "password": "oPassword"}]';
    process.env['INPUT_GITHUBSERVER'] = true;

    process.env['INPUT_MIRRORS'] = '[{"id": "mirrorId", "name": "mirror Name", "mirrorOf": "mirror Off *", "url": "mirror url"}]';
    process.env['INPUT_PROXIES'] = '[{"id": "proxyId", "active": "isActive", "protocol": "proxyProtocol", "host": "proxyHost", "port": "proxyPort", "nonProxyHosts": "nonProxyHost"}]';
    process.env['INPUT_PROPERTIES'] = '[{"prop1": "value1"}, {"prop2": "value2"}]'

    process.env['INPUT_APACHESNAPSHOTS'] = true;
    process.env['INPUT_SONATYPESNAPSHOTS'] = true;
    process.env['INPUT_ORACLEREPO'] = true;
    process.env['INPUT_REPOSITORIES'] = '[{"id":"repoId","name":"repoName","url":"url","snapshots":{"enabled":true}}]'

    cp.spawnSync('node', [ `${indexPath}` ], { env: process.env, stdio: 'inherit' });
    const settingsStatus = fs.lstatSync(settingsPath);
    expect(settingsStatus.isFile()).toBeTruthy();
    expect(settingsStatus.size).toBeGreaterThan(0);

    const settingsBody = fs.readFileSync(settingsPath).toString().replace(/^\s*$(?:\r\n?|\n)/gm, '');
    expect(settingsBody).toBe(`<settings>
    <interactiveMode>false</interactiveMode>
    <profiles>
<profile>
    <id>_properties_</id>
    <activation>
        <activeByDefault>true</activeByDefault>
    </activation>
    <properties><prop1>value1</prop1><prop2>value2</prop2></properties>
</profile>
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
</profile>
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
</profile>
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
</profile>
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
 </repository></repositories>
    <pluginRepositories/>
</profile></profiles>
    <servers>
<server>
    <id>serverId</id>
    <username>sUsername</username>
    <password>sPassword</password>
    <configuration><props1>value1</props1></configuration>
</server>
<server>
    <id>oServerId</id>
    <username>oUsername</username>
    <password>oPassword</password>
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
</server>
<server>
    <id>github</id>
    <username>\${env.GITHUB_ACTOR}</username>
    <password>\${env.GITHUB_TOKEN}</password>
</server></servers>
    <mirrors>
<mirror>
    <id>mirrorId</id>
    <name>mirror Name</name>
    <mirrorOf>mirror Off *</mirrorOf>
    <url>mirror url</url>
</mirror></mirrors>
    <proxies><proxy>
    <id>proxyId</id>
    <active>isActive</active>
    <protocol>proxyProtocol</protocol>
    <host>proxyHost</host>
    <port>proxyPort</port>
    <nonProxyHosts>nonProxyHost</nonProxyHosts>
</proxy></proxies>
</settings>`);
})