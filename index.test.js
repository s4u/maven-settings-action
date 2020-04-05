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

    process.env['INPUT_SERVERS'] =  '[{"id": "serverId", "username": "username", "password": "password"}]';
    process.env['INPUT_PROPERTIES'] = '[{"prop1": "value1"}, {"prop2": "value2"}]';
    process.env['INPUT_SONATYPESNAPSHOTS'] = true;

    cp.execSync(`node ${indexPath}`, { env: process.env }).toString();

    const settingsStatus = fs.lstatSync(settingsPath);
    expect(settingsStatus.isFile()).toBeTruthy();
    expect(settingsStatus.size).toBeGreaterThan(0);

    const settingsBody = fs.readFileSync(settingsPath).toString();
    expect(settingsBody).toMatch('<settings>');
    expect(settingsBody).toMatch('<servers><server><id>serverId</id><username>username</username><password>password</password></server></servers>');
    expect(settingsBody).toMatch('<activeByDefault>true</activeByDefault>');
    expect(settingsBody).toMatch('prop1');
})
