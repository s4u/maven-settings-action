#!/bin/sh

echo "old_version: $npm_old_version"
echo "new_version: $npm_new_version"
echo "package_name: $npm_package_name"

sed -i '' "s/$npm_package_name@v$npm_old_version/$npm_package_name@v$npm_new_version/g" README.md

git add README.md
