#!/bin/bash
while true; do
    npm run main & q_pid="${!}"
    ( sleep 1800 ; kill "${q_pid}" ) & s_pid="${!}"
    wait "${q_pid}"
    kill "${s_pid}"
    wait "${s_pid}"
done
