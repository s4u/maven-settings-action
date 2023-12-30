# maven-settings-action
[![Test](https://github.com/s4u/maven-settings-action/workflows/Test/badge.svg)](https://github.com/s4u/maven-settings-action/actions?query=workflow%3ATest)
[![Audit](https://github.com/s4u/maven-settings-action/workflows/Audit/badge.svg)](https://github.com/s4u/maven-settings-action/actions?query=workflow%3AAudit)


This action sets up Maven environments for use in GitHub Actions by:
 - create maven settings.xml
 - set ```interactiveMode``` to false - useful in CI system
 - after job finish generated settings.xml will be removed to prevent cache or left sensitive data on build system
 - add server to servers with id=github, username=$GITHUB_ACTOR and password=$GITHUB_TOKEN

# Contributions
- Contributions are welcome!
- Give :star: - if you want to encourage me to work on a project
- Don't hesitate to create issues for new features you dream of or if you suspect some bug

# Project versioning
This project uses [Semantic Versioning](https://semver.org/).
We recommended to use the latest and specific release version.

In order to keep your project dependencies up to date you can watch this repository *(Releases only)*
or use automatic tools like [Dependabot](https://docs.github.com/en/code-security/supply-chain-security/keeping-your-dependencies-updated-automatically/about-dependabot-version-updates).


 # Usage

 You can try our action [Setup Maven Action](https://github.com/marketplace/actions/setup-maven-action) for completely maven environment setup.

See [action.yml](action.yml)

## default ```settings.xml```
```yml
steps:
- uses: s4u/maven-settings-action@v3.0.0
```

## ```settings.xml``` with servers section

```yml
steps:
- uses: s4u/maven-settings-action@v3.0.0
  with:
    servers: '[{"id": "serverId", "username": "username", "password": "password"}]'
```

Also you can use `path` argument if your settings.xml is stored in different location.


All `server` attributes may be specified:
  * `id` _(required)_
  * `username`
  * `password`
  * `privateKey`
  * `passphrase`
  * `filePermissions`
  * `directoryPermissions`
  * `configuration`

Please refer to the [servers](http://maven.apache.org/settings.html#Servers) documentation for more information.

## ```settings.xml``` with servers section and additional configuration

``` yml
steps:
- uses: s4u/maven-settings-action@v3.0.0
  with:
    servers: |
      [{
        "id": "serverId",
        "configuration": {
          "item1": "value1",
          "item2": {
            "item21": "value21",
            "item22": "value22"
          }
        }
      }]
```

result will be:

```xml
<server>
    <id>serverId</id>
    <configuration>
      <item1>value1</item1>
      <item2>
        <item21>value21</item21>
        <item22>value22</item22>
      </item1>
    </configuration>
</server></servers>
```


## ```settings.xml``` with mirrors section
```yml
steps:
- uses: s4u/maven-settings-action@v3.0.0
  with:
    mirrors: '[{"id": "mirrorId", "name": "mirrorName", "mirrorOf": "mirrorOf", "url": "mirrorUrl"}]'
```

## ```settings.xml``` with proxies section
```yml
step:
- uses: s4u/maven-settings-action@v3.0.0
  with:
    proxies: '[{"id": "proxyId", "active": "isActive", "protocol": "proxyProtocol", "host": "proxyHost", "port": "proxyPort", "nonProxyHosts": "nonProxyHost"}]'
```

## ```settings.xml``` with properties
```yml
steps:
- uses: s4u/maven-settings-action@v3.0.0
  with:
    properties: '[{"propertyName1": "propertyValue1"}, {"propertyName2": "propertyValue2"}]'
```

## ```settings.xml``` with https://oss.sonatype.org/content/repositories/snapshots in repository list

```yml
steps:
- uses: s4u/maven-settings-action@v3.0.0
  with:
    sonatypeSnapshots: true
```

## ```settings.xml``` with https://repository.apache.org/snapshots/ in repository list

```yml
steps:
- uses: s4u/maven-settings-action@v3.0.0
  with:
    apacheSnapshots: true
```

## Do not override existing ```settings.xml```, from version **2.0** file is override by default :
```yml
steps:
- uses: s4u/maven-settings-action@v3.0.0
  with:
    override: false
```

## Do not add github to server in ```settings.xml```, by default is added:
```yml
steps:
- uses: s4u/maven-settings-action@v3.0.0
  with:
    githubServer: false
```

## ```settings.xml``` with special server item configuration for oracle repository [Oracle Maven Repository](https://docs.oracle.com/middleware/1213/core/MAVEN/config_maven_repo.htm#MAVEN9015)

```yml
steps:
- uses: s4u/maven-settings-action@v3.0.0
  with:
    oracleServers: '[{"id": "serverId", "username": "username", "password": "password"}]'
```

## ```settings.xml``` with [Oracle Maven Repository](https://docs.oracle.com/middleware/1213/core/MAVEN/config_maven_repo.htm#MAVEN9017)
```yml
steps:
- uses: s4u/maven-settings-action@v3.0.0
  with:
    oracleRepo: true
```

## ```settings.xml``` with custom repositories
```yml
steps:
- uses: s4u/maven-settings-action@v3.0.0
  with:
    repositories: '[{"id":"repoId","name":"repoName","url":"url","snapshots":{"enabled":true}}]'
```


## GitHub actions secrets

It is also possible pass in Github Secrets e.g.

``` yml
steps:
- uses: s4u/maven-settings-action@v3.0.0
  with:
    servers: |
      [{
          "id": "sonatype-nexus-snapshots",
          "username": "${{ secrets.SONATYPE_USERNAME }}",
          "password": "${{ secrets.SONATYPE_PASSWORD }}"
      }]
```

**Note**: secrets are *not* passed in if the workflow is triggered from a forked repository. See [here](https://docs.github.com/en/free-pro-team@latest/actions/reference/encrypted-secrets#using-encrypted-secrets-in-a-workflow) for further information. This can be avoided by using `if` triggers on the job e.g. `if: github.event_name == 'push'`.

# Notes

**maven-settings-action** should be put at the latest position before maven run in order to avoid override ```setting.xml``` by another action

```yml
  steps:
      - uses: actions/checkout@v2

      - uses: actions/cache@v2
        with:
          path: ~/.m2/repository
          key: maven-${{ hashFiles('**/pom.xml') }}
          restore-keys: maven-

      - uses: actions/setup-java@v1
        with:
          java-version: 8

      - uses: s4u/maven-settings-action@v3.0.0

      - run: mvn verify
```

# License

The scripts and documentation in this project are released under the [MIT License](LICENSE).
