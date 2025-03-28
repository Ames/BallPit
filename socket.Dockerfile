
FROM node:23-bookworm
WORKDIR /home/node/app

RUN npm install socket.io
COPY socket.js socket.js

EXPOSE 8124
CMD [ "node", "socket.js" ]
