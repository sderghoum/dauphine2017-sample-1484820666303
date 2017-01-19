
FROM registry.ng.bluemix.net/ibmnode:latest
# Define working directory.
RUN mkdir -p /testfinal
WORKDIR /testfinal

COPY package.json /testfinal/
RUN npm install
COPY . /testfinal



EXPOSE 8080
# Define default command.
CMD ["npm", "start"]
