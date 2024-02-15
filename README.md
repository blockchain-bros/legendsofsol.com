### local build docker
- `DOCKER_DEFAULT_PLATFORM=linux/amd64 docker compose build`
- `docker build . --platform=linux/amd64 -t sosol/p1`
- `docker push sosol/p1`

### server process

- `sudo nano /etc/nginx/sites-available/default`
- `sudo systemctl reload nginx`
- `sudo docker pull sosol/p1`
- `sudo docker stop $(sudo docker ps -a -q)`
- `sudo docker run -p 3000:3000 -d sosol/p1`
- `sudo docker run -it --rm sosol/p1`
- `sudo docker exec -it 4ce067c36d09 /bin/bash`


