# maven-settings-action

This action setup maven environment for use in action by:
 - create maven setings.xml
 - set ```interactiveMode``` to false - useful in CI system

 # Usage
See [action.yml](action.yml)

Crate default ```settings.xml```:
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
    sonatype-snapshots: true
```

# License

The scripts and documentation in this project are released under the [MIT License](LICENSE)

# Contributions

Contributions are welcome!
