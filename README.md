# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

npm run dev


Docker: 


PS C:\Users\chris\apps\Stratflow> docker run --name stratflow-db -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=admin -e POSTGRES_DB=stratflow -p 5432:5432 -d postgres
>>
Unable to find image 'postgres:latest' locally
latest: Pulling from library/postgres
38513bd72563: Pulling fs layer
b73bf0979e94: Pull complete
ff3cd642415f: Pull complete
04e8facb1296: Pull complete
61a61f9e6b82: Pull complete
0e792559c1d6: Pull complete
23ed4c7c49ef: Pull complete
1387828da9a3: Pull complete
58e43dd6f022: Pull complete
e43339a5b9c6: Pull complete
26f20d020b0e: Pull complete
600882e18ec8: Pull complete
ea420c4160d7: Pull complete
Digest: sha256:1ffc019dae94eca6b09a49ca67d37398951346de3c3d0cfe23d8d4ca33da83fb
Status: Downloaded newer image for postgres:latest
d7244c5b713e1e81ec918a30291425dd86cdec27e8f191a37ee9e5649def2b91
PS C:\Users\chris\apps\Stratflow> docker ps
>>
CONTAINER ID   IMAGE      COMMAND                  CREATED          STATUS          PORTS                    NAMES
d7244c5b713e   postgres   "docker-entrypoint.s…"   12 seconds ago   Up 11 seconds   0.0.0.0:5432->5432/tcp   stratflow-db
PS C:\Users\chris\apps\Stratflow> docker exec -it stratflow-db psql -U postgres -d stratflow
>>
psql (18.0 (Debian 18.0-1.pgdg13+3))
Type "help" for help.

