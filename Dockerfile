# syntax=docker/dockerfile:1

FROM node:24.15-alpine3.22 AS base

ARG UID=1000
ARG GID=1000

RUN <<-EOR
	set -e
	apk add --update --no-cache shadow=~4.19
	groupmod -g "${GID}" node
	usermod -u "${UID}" -g "${GID}" node
	apk del shadow
EOR

USER node
WORKDIR /usr/src/app

FROM base AS development

ENV NODE_ENV="development"

RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    npm ci

EXPOSE 8080

CMD ["npm", "start"]
