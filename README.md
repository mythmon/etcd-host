Creates an entry in etcd at /hosts/$hostname.

This is designed to be combined with
[nss\_etcd](https://github.com/tingar/libnss_etcd).

Usage
=====

```
Options:
   -i, --interface   Interface to query for IP.
   -t, --ttl         Time for keys to expire (seconds).  [60]
   -p, --period      Amount of time to wait between updates (seconds).  [30]
   -P, --peers       Etcd peers to query.
```

Systemd
=======

The included systemd service file can be used to pair this with another
service, which is the recommended way to use it. To configure and pair
the service, add a file at
`/etc/systemd/system/etcd-host@.service.d/pairing.conf` (or similar),
and add something like this:

```systemd.conf
[Unit]
PartOf=tincd@%i.service

[Service]
Environment="ETCDCTL_PEERS=http://10.42.14.1:4001,http://10.42.69.69:4001,http://10.42.10.10:4001"

[Install]
WantedBy=tincd@%i.service
```

This pairs `etcd-host@` to `tincd@`. Enable both with `systemctl enable
etcd-host@dev tincd@dev`. `etcd-host@dev` will start automaticalled when
ever `tincd@dev` starts.
