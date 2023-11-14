FROM node:18
RUN apt update && apt install -y curl
RUN mkdir -p /usr/app
#/var/lib/docker/volumes/bureau_back/_data
RUN mkdir /usr/log 
RUN  chmod 777 -R /usr/log
RUN mkdir /usr/dataset
RUN chmod 777 -R /usr/dataset
WORKDIR /usr/app
COPY package.json ./
RUN chown -R node:node /usr/app
USER node:node
RUN mkdir log && chmod 777 -R log
RUN mkdir dataset && chmod 777 -R dataset
RUN npm install
COPY --chown=node:node . . 
RUN npm install express
COPY . ./
EXPOSE 3004
CMD ["npm", "start"] 
