## Kalliope installation lokalt

1. Installer [NodeJS](https://nodejs.org/en/).
2. Hent din kopi af Kalliope på [GitHub](https://github.com/thabz/Kalliope.git) enten som zip-fil eller, bedre, som en git-clone.
3. Åbn en terminal (Terminal.app på Mac, PowerShell på Windows eller hvad som helst på Linux) og find mappen med din kopi af Kalliope.
4. Udfør derefter følgende trin (hvoraf nogle kan tage lang tid)
  ```shell
  npm install
  npm run build
  npm run build-static
  npm run start
  ```
Hvis alt lykkes, kan din egen kopi af Kalliope nu ses på http://localhost:3000/.

Hvis du nu retter i en XML-fil, f.eks. under `/fdirs/`, skal `npm run build-static` udføres igen, hvorefter ændringen kan ses i browseren. `npm run build-static` udføres meget hurtigt anden gang man kører den, da kun ændrede xml-filer behandles.

## Kalliope installation på server

### Install

```shell
mkdir ~/home/jec/Sites
cd ~/home/jec/Sites
git checkout ...
npm run build
```

### systemd

```shell
sudo cp ~/home/jec/Sites/tools/kalliope.service /etc/systemd/system
sudo systemctl daemon-reload
sudo systemctl enable kalliope.service
```

Now Kalliope should start on system start (after nginx). Test with 
``` 
sudo systemctl start kalliope # To et
```

