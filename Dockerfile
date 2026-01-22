FROM node:lts-alpine AS base
WORKDIR /app
ARG PNPM_HOME="/pnpm"
ARG PATH="$PNPM_HOME:$PATH"
ENV NODE_ENV=production
RUN corepack enable
COPY package.json .
COPY pnpm-lock.yaml .

FROM base AS prod-deps
RUN pnpm install --frozen-lockfile -P

FROM prod-deps AS build
COPY . .
RUN pnpm install --frozen-lockfile && \
    pnpm run build

FROM prod-deps AS run
COPY --from=build /app/build build
COPY --from=build /app/LICENSE .
ENTRYPOINT [ "node" ]
CMD ["build/index.js"]