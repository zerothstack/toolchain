#!/usr/bin/env bash

MESSAGE=$(git log -1 HEAD --pretty=format:%s)

eval "$(ssh-agent -s)" #start the ssh agent
chmod 600 .travis/deployment_key.pem # this key should have push access
ssh-add .travis/deployment_key.pem

u doc:build
u doc:api
cd dist-docs
git init
git add --all
git commit -am "$MESSAGE"

git remote add deploy git@github.com:ubiquits/ubiquits.github.io.git
git push deploy master -f
cd ..