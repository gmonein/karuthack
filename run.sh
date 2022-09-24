#!/bin/bash
nvm use 18
while true; do
    ./node_modules/typescript/bin/tsc auto_grabber.js && NODE_NO_WARNINGS=1 node auto_grabber.js & q_pid="${!}"
    ( sleep 3600 ; kill "${q_pid}" ) & s_pid="${!}"
    wait "${q_pid}"
    kill "${s_pid}"
    wait "${s_pid}"
done
