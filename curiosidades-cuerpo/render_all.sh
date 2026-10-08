#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
for id in Long Short-bones Short-stomach Short-eye Short-brain Short-dna; do
  npx remotion render src/index.ts "$id" "out/silent/$id.mp4" --crf=23 --log=error
  echo "done $id $(date +%T)"
done
