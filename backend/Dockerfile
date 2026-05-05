FROM golang:1.24-alpine

RUN apk add --no-cache \
    bash build-base coreutils gcc git make \
    musl-dev openssl-dev rpm lz4-dev zlib-dev \
    wget cyrus-sasl-dev cyrus-sasl-gssapiv2 \
    krb5 krb5-pkinit krb5-dev \
    libaio libnsl libc6-compat curl && \
    cd /tmp && \
    curl -o instantclient-basiclite.zip https://download.oracle.com/otn_software/linux/instantclient/193000/instantclient-basic-linux.x64-19.3.0.0.0dbru.zip -SL && \
    unzip instantclient-basiclite.zip && \
    mv instantclient*/ /usr/lib/instantclient && \
    rm instantclient-basiclite.zip && \
    ln -s /usr/lib/instantclient/libclntsh.so.19.1 /usr/lib/libclntsh.so && \
    ln -s /usr/lib/instantclient/libocci.so.19.1 /usr/lib/libocci.so && \
    ln -s /usr/lib/instantclient/libociicus.so /usr/lib/libociicus.so && \
    ln -s /usr/lib/instantclient/libnnz19.so /usr/lib/libnnz19.so && \
    ln -s /usr/lib/libnsl.so.2 /usr/lib/libnsl.so.1 || true && \
    ln -s /lib/libc.so.6 /usr/lib/libresolv.so.2 || true && \
    ln -s /lib64/ld-linux-x86-64.so.2 /usr/lib/ld-linux-x86-64.so.2 || true

ENV ORACLE_BASE /usr/lib/instantclient
ENV LD_LIBRARY_PATH /usr/lib/instantclient
ENV TNS_ADMIN /usr/lib/instantclient
ENV ORACLE_HOME /usr/lib/instantclient

WORKDIR /app/go-api-app
COPY go.mod .
COPY go.sum .
RUN go mod download
COPY . .
RUN go build -o ./app .

EXPOSE 80
CMD ["./app","{ENV}"]