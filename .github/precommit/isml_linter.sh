#!/bin/bash

npm version > /dev/null || (echo "npm not installed; please install npm." && exit 1)


package='isml-linter'
if [ `npm list --location=global | grep -c $package` -eq 0 ]; then
   echo "Installing isml-linter"
   npm install --location=global $package
fi

errors=$(isml-linter $@)
if [ ! -z "$errors" ]; then
   isml-linter $@
   isml-linter --autofix $@ > /dev/null
   exit 1
fi
