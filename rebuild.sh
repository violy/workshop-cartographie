#!/bin/bash

#COLORS
GREEN="\033[32m"
YELLOW="\033[33m"
RED="\033[31m"
BLUE="\033[34m"
RESET="\033[0m"



ORIGINS=("a." "b." "c." "")
HOSTNAME="origin.atlas.violy.fr"

# récupère la derniere version git
git pull

# arrete les containers Docker et les supprime
echo -e "${YELLOW}Stoping containers...$RESET"
for CONTAINER in "${ORIGINS[@]}"
do
    echo -e "${RED}Stoping container ${CONTAINER}${HOSTNAME}$RESET"
    docker rm -f ${CONTAINER}${HOSTNAME}
done

# fait un build à partir de la derniere archive
docker build -t workshop-cartographie:latest .

# démarre les containers Docker à partir de l'image en cours
echo -e "${GREEN}Starting containers...${RESET}"

for CONTAINER in "${ORIGINS[@]}"
do

    VIRTUAL_HOST_ENV="--env VIRTUAL_HOST=${CONTAINER}${HOSTNAME}"
    #
    echo -e "${BLUE}Starting container ${CONTAINER}${HOSTNAME}${GREEN}"
    echo $VIRTUAL_HOST_ENV;
    #
    docker run -d \
    -v $(pwd)/images:/opt/node/js/images \
    -v $(pwd)/.cache:/opt/node/js/.cache \
    -v $(pwd)/public:/opt/node/js/public \
    -v $(pwd)/uploads:/opt/node/js/uploads \
    --env VIRTUAL_HOST=${CONTAINER}${HOSTNAME} \
    --hostname ${CONTAINER}${HOSTNAME} \
    --name ${CONTAINER}${HOSTNAME} \
    workshop-cartographie

done

echo -e "${GREEN}Done.${RESET}"