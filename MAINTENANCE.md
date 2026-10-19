# update dependencies

    npm update
    npm outdated

If new version exist put '*' in `package.json` and run again `npm update`

- new commit with dependency updates

# new release

 - run - npm version patch -m "prepare release %s"
or
 - run - npm version minor -m "prepare release %s"

 - push commit

 - checkout releases/vX
 - merge master and push
 - run - dependencies must be the same as on master, so don't use `npm update` here
    npm ci
    npm prune --omit=dev
 - commit and push "update dependency after merge from master"
 - git tag and git push --tags
