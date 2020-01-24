# maven-settings-action
[![Test Action](https://github.com/s4u/maven-settings-action/workflows/Test%20Action/badge.svg)](https://github.com/s4u/maven-settings-action/actions)

This action setup maven environment for use in action by:
 - create maven settings.xml
 - set ```interactiveMode``` to false - useful in CI system
 - after job finish generated settings.xml will be removed to prevent cache or left sensitive data on build system

 # Usage
See [action.yml](action.yml)

Create default ```settings.xml```:
```yml
steps:
- uses: s4u/maven-settings-action@v1
```

Create ```settings.xml``` with server section:
```yml
steps:
- uses: s4u/maven-settings-action@v1
  with:
    servers: '[{"id": "serverId", "username": "username", "password": "password"}]'
```

Create ```settings.xml``` with maven properties:
```yml
steps:
- uses: s4u/maven-settings-action@v1
  with:
    properties: '[{"propertyName1": "propertyValue1"}, {"propertyName2": "propertyValue2"}]'
```

Create ```settings.xml``` with https://oss.sonatype.org/content/repositories/snapshots in repository list
```yml
steps:
- uses: s4u/maven-settings-action@v1
  with:
    sonatypeSnapshots: true
```

Override existing existing ```settings.xml```:
```yml
steps:
- uses: s4u/maven-settings-action@v1
  with:
    override: true
```


# License

The scripts and documentation in this project are released under the [MIT License](LICENSE)

# Contributions

Contributions are welcome!
