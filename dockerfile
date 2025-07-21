FROM node

RUN mkdir -p phonebook

COPY . .

CMD ["node", "src/index.js"]