const process = require('process');
const cp = require('child_process');
const path = require('path');
const fs = require('fs');

const testHomePath = path.join(__dirname, 'temp');
const settingsPath = path.join(testHomePath, '.m2', 'settings.xml');
const indexPath = path.join(__dirname, 'index.js');

beforeAll(() => {
    if (!fs.existsSync(testHomePath)) {
        fs.mkdirSync(testHomePath);
    }

    process.env['HOME'] = testHomePath;
});

afterEach(() => {
    try {
        fs.unlinkSync(settingsPath);
    } catch (error) {
        console.error(error.message);
    }
});

afterAll(() => {
    try {
        fs.rmdirSync(path.join(testHomePath, ".m2"));
        fs.rmdirSync(testHomePath);
    } catch (error) {
        console.error(error.message);
    }
});


test('run with default values', () => {

    console.log(cp.execSync(`node ${indexPath}`, { env: process.env }).toString());
    const settingsStatus = fs.lstatSync(settingsPath);
    expect(settingsStatus.isFile()).toBeTruthy();
    expect(settingsStatus.size).toBeGreaterThan(0);
})

test('run with all feature', () => {

    process.env['INPUT_SERVERES'] =  '[{"id": "serverId", "username": "username", "password": "password"}]';
    process.env['INPUT_PROPERTIES'] = '[{"prop1": "value1"}, {"prop2": "value2"}]'
    process.env['INPUT_SONATYPESNAPSHOT'] = true;

    console.log(cp.execSync(`node ${indexPath}`, { env: process.env }).toString());
    const settingsStatus = fs.lstatSync(settingsPath);
    expect(settingsStatus.isFile()).toBeTruthy();
    expect(settingsStatus.size).toBeGreaterThan(0);
})
