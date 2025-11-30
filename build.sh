#!/usr/bin/env bash
set -e

echo "===> Baue DualNet mit Maven Wrapper..."
./mvnw clean package

echo "===> Build erfolgreich."
