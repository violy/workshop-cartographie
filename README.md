# workshop-cartographie
Workshop Cartographie - Académie Charpentier

# Docker

le build

    docker build -t workshop-cartographie:latest .
    
le run

    docker run -d \
    -v $(pwd)/images:/opt/node/js/images \
    -v $(pwd)/.cache:/opt/node/js/.cache \
    -v $(pwd)/public:/opt/node/js/public \
    -e VIRTUAL_HOST=atlas.violy.fr,*.cdn.atlas.violy.fr,origin.atlas.violy.fr \
    --name atlas.violy.fr \
    workshop-cartographie