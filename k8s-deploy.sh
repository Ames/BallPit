docker build . -f web.Dockerfile -t localhost:32000/ballpit-web:latest
docker push localhost:32000/ballpit-web:latest

docker build . -f socket.Dockerfile -t localhost:32000/ballpit-socket:latest
docker push localhost:32000/ballpit-socket:latest

microk8s kubectl rollout restart deploy ballpit
