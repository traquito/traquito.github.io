#!env bash

echo "mkdocs build"
mkdocs build

echo "git add ./site"
git add ./site

echo "git commit -m 'site publish'"
git commit -m 'site publish'

echo "git push"
git push
