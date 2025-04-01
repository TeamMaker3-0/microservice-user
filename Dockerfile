# teammaker_backend/user-microservice/Dockerfile
FROM node
WORKDIR /user-microservice

# Copiar package.json e instalar dependencias
COPY package.json ./
RUN npm install

# Copiar el resto del código
COPY . .


RUN npm run build


# Exponer el puerto en el que escucha tu servicio (por ejemplo 3001)
EXPOSE 3001

# Comando de arranque
CMD ["npm", "run", "start"]