
## Kalliope installation

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

