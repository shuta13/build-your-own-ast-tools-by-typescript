FROM node:24.22.1

WORKDIR /usr/src/app

COPY . .

RUN for dir in $(ls -d */); do \
      cd "$dir" && \
      if [ -f package.json ]; then \
        npm install || exit 1; \
      fi; \
      cd ..; \
    done

CMD [ "bash" ]
