## Kalliope installation lokalt

```shell
git clone https://github.com/thabz/Kalliope.git
cd Kalliope
npm install
npm build
npm build-static
npm run start
```

Hvorefter din egen kopi af Kalliope kan ses på http://localhost:3000/.

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

