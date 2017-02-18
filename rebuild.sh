#!/bin/bash

# récupère la derniere version git
git pull

# arrete le container Docker et le supprime
docker rm -f atlas.violy.fr

# fait un build à partir de la derniere archive
docker build -t workshop-cartographie:latest .

# démarre un nouveau container Docker
docker run -d \
-v $(pwd)/images:/opt/node/js/images \
-v $(pwd)/.cache:/opt/node/js/.cache \
-v $(pwd)/public:/opt/node/js/public \
-e VIRTUAL_HOST=atlas.violy.fr,*.cdn.atlas.violy.fr,origin.atlas.violy.fr \
--name atlas.violy.fr \
workshop-cartographie