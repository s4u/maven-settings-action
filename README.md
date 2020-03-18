# maven-settings-action
[![Test Action](https://github.com/s4u/maven-settings-action/workflows/Test%20Action/badge.svg)](https://github.com/s4u/maven-settings-action/actions)

This action setup maven environment for use in action by:
 - create maven settings.xml
 - set ```interactiveMode``` to false - useful in CI system
 - after job finish generated settings.xml will be removed to prevent cache or left sensitive data on build system
 - add server to servers with id=github, username=$GITHUB_ACTOR and password=$GITHUB_TOKEN

# Contributions

- Contributions are welcome!
- Give a star - if you want to encourage me to work on a project
- Don't hesitate create issue

 # Usage
See [action.yml](action.yml)

Create default ```settings.xml```:
```yml
steps:
- uses: s4u/maven-settings-action@v2
```

Create ```settings.xml``` with server section:
```yml
steps:
- uses: s4u/maven-settings-action@v2
  with:
    servers: '[{"id": "serverId", "username": "username", "password": "password"}]'
```

Create ```settings.xml``` with maven properties:
```yml
steps:
- uses: s4u/maven-settings-action@v2
  with:
    properties: '[{"propertyName1": "propertyValue1"}, {"propertyName2": "propertyValue2"}]'
```

Create ```settings.xml``` with https://oss.sonatype.org/content/repositories/snapshots in repository list
```yml
steps:
- uses: s4u/maven-settings-action@v2
  with:
    sonatypeSnapshots: true
```

Do not override existing ```settings.xml```, from version 2.0 file is override by default :
```yml
steps:
- uses: s4u/maven-settings-action@v2
  with:
    override: false
```

Do not add github to server in ```settings.xml```, by default is added:
```yml
steps:
- uses: s4u/maven-settings-action@v2
  with:
    githubServer: false
```

# License

The scripts and documentation in this project are released under the [MIT License](LICENSE)
