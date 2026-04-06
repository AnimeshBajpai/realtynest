#!/bin/bash
cd /home/site/wwwroot
if [ -L node_modules ]; then
  rm -f node_modules
fi
if [ ! -d node_modules ] && [ -f node_modules.tar.gz ]; then
  echo 'Extracting node_modules.tar.gz...'
  tar xzf node_modules.tar.gz
  echo 'Done extracting.'
fi
echo 'Starting Node.js app...'
node index.js