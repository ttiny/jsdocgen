#!/bin/bash
DIR="$( cd -P "$( dirname "$BASH_SOURCE[0]" )" && pwd )"
export NODE_PATH=$DIR/../../../deps/docviewjs/deps/node/node_modules:$DIR/../../../deps/node_modules
$DIR/../../../deps/docviewjs/deps/node/node-$(uname) $DIR/update_factorysymbols.js $@