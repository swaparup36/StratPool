FROM oven/bun:1.3-debian

ARG CRE_VERSION=v1.39.0

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl \
  && curl -fsSL "https://github.com/smartcontractkit/cre-cli/releases/download/${CRE_VERSION}/cre_linux_amd64.tar.gz" | tar -xz -C /tmp \
  && install -m 755 /tmp/cre_* /usr/local/bin/cre \
  && rm -rf /tmp/cre_* /var/lib/apt/lists/* \
  && mkdir -p /home/cre \
  && chmod 777 /home/cre

ENV HOME=/home/cre
WORKDIR /workspace
ENTRYPOINT []
