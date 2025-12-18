FROM nginx:alpine

# Copier tous les fichiers du frontend
COPY index.html /usr/share/nginx/html/
COPY styles.css /usr/share/nginx/html/
COPY app.js /usr/share/nginx/html/

# Exposer le port 80
EXPOSE 80

# Nginx démarre automatiquement