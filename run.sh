#!/bin/bash
while true; do
    NODE_NO_WARNINGS=1 node test.js & q_pid="${!}"
    ( sleep 3600 ; kill "${q_pid}" ) & s_pid="${!}"
    wait "${q_pid}"
    kill "${s_pid}"
    wait "${s_pid}"
done
