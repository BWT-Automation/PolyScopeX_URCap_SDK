#!/bin/bash

##############################################################################
# Bash script for creating a URCap project
##############################################################################
set -e
{
  pushd urcap-generator > /dev/null
  yo urcap "$@"
  popd > /dev/null
} || {
  popd > /dev/null
}
