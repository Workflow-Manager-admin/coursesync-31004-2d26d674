#!/bin/bash
cd /home/kavia/workspace/code-generation/coursesync-31004-2d26d674/course_sync
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

