# syntax=docker/dockerfile:1

FROM node:22.15-alpine3.21 as base

ARG UID=1000
ARG GID=1000

RUN <<-EOR
	set -e
	apk add --update --no-cache shadow=~4.16
	groupmod -g "${GID}" node
	usermod -u "${UID}" -g "${GID}" node
	apk del shadow
EOR

USER node
WORKDIR /usr/src/app

FROM base as development

ENV NODE_ENV="development"

RUN --mount=type=bind,source=package.json,target=package.json \
    npm install --include=dev

EXPOSE 8080

CMD ["npm", "start"]
