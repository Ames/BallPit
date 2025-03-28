
FROM nginx:1.27-bookworm

WORKDIR /usr/share/nginx/html/ballpit/

COPY index.html .
COPY master.html .

COPY ballpit.css .

COPY ballpit.js .
COPY favGen.js .

