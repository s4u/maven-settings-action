# maven-settings-action
[![Test](https://github.com/s4u/maven-settings-action/workflows/Test/badge.svg)](https://github.com/s4u/maven-settings-action/actions?query=workflow%3ATest)
[![Audit](https://github.com/s4u/maven-settings-action/workflows/Audit/badge.svg)](https://github.com/s4u/maven-settings-action/actions?query=workflow%3AAudit)


This action setup maven environment for use in action by:
 - create maven settings.xml
 - set ```interactiveMode``` to false - useful in CI system
 - after job finish generated settings.xml will be removed to prevent cache or left sensitive data on build system
 - add server to servers with id=github, username=$GITHUB_ACTOR and password=$GITHUB_TOKEN

# Contributions
- Contributions are welcome!
- Give :star: - if you want to encourage me to work on a project
- Don't hesitate create issue for new feature you dream of or if you suspect some bug

# Project versioning
Project use [Semantic Versioning](https://semver.org/).
We recommended to use the latest and specific release version.

In order to keep your project dependencies up to date you can watch this repository *(Releases only)*
or use automatic tools like [Dependabot](https://dependabot.com/).


 # Usage
See [action.yml](action.yml)

Create default ```settings.xml```:
```yml
steps:
- uses: s4u/maven-settings-action@v2.2.0
```

Create ```settings.xml``` with servers section:
```yml
steps:
- uses: s4u/maven-settings-action@v2.2.0
  with:
    servers: '[{"id": "serverId", "username": "username", "password": "password"}]'
```

Create ```settings.xml``` with mirrors section:
```yml
steps:
- uses: s4u/maven-settings-action@v2.2.0
  with:
    mirrors: '[{"id": "mirrorId", "name": "mirrorName", "mirrorOf": "mirrorOf", "url": "mirrorUrl"}]'
```

Create ```settings.xml``` with maven properties:
```yml
steps:
- uses: s4u/maven-settings-action@v2.2.0
  with:
    properties: '[{"propertyName1": "propertyValue1"}, {"propertyName2": "propertyValue2"}]'
```

It is also possible pass in Github Secrets e.g.

``` yml
      with:
        servers: |
            [{
                "id": "sonatype-nexus-snapshots",
                "username": "${{ secrets.SONATYPE_USERNAME }}",
                "password": "${{ secrets.SONATYPE_PASSWORD }}"
            }]

```

**Note**: secrets are *not* passed in if the workflow is triggered from a forked repository. See [here](https://docs.github.com/en/free-pro-team@latest/actions/reference/encrypted-secrets#using-encrypted-secrets-in-a-workflow) for further information. This can be avoided by using `if` triggers on the job e.g. `if: github.event_name == 'push'`.


Create ```settings.xml``` with https://oss.sonatype.org/content/repositories/snapshots in repository list
```yml
steps:
- uses: s4u/maven-settings-action@v2.2.0
  with:
    sonatypeSnapshots: true
```

Create ```settings.xml``` with https://repository.apache.org/snapshots/ in repository list
```yml
steps:
- uses: s4u/maven-settings-action@v2.2.0
  with:
    apacheSnapshots: true
```

Do not override existing ```settings.xml```, from version 2.0 file is override by default :
```yml
steps:
- uses: s4u/maven-settings-action@v2.2.0
  with:
    override: false
```

Do not add github to server in ```settings.xml```, by default is added:
```yml
steps:
- uses: s4u/maven-settings-action@v2.2.0
  with:
    githubServer: false
```

Create ```settings.xml``` with special server item configuration for oracle repository [Oracle Maven Repository](https://docs.oracle.com/middleware/1213/core/MAVEN/config_maven_repo.htm#MAVEN9015)
```yml
steps:
- uses: s4u/maven-settings-action@v2.2.0
  with:
    oracleServers: '[{"id": "serverId", "username": "username", "password": "password"}]'
```

Create ```settings.xml``` with [Oracle Maven Repository](https://docs.oracle.com/middleware/1213/core/MAVEN/config_maven_repo.htm#MAVEN9017)
```yml
steps:
- uses: s4u/maven-settings-action@v2.2.0
  with:
    oracleRepo: true
```

# License

The scripts and documentation in this project are released under the [MIT License](LICENSE)
