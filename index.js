#!/usr/bin/env node
var Etcd = require('node-etcd');
var os = require('os');
var nomnom = require('nomnom');

var opts = nomnom
.option('interface', {
  abbr: 'i',
  help: 'Interface to query for IP.',
  required: true,
})
.option('ttl', {
  abbr: 't',
  help: 'Time for keys to expire (seconds).',
  default: 60,
})
.option('period', {
  abbr: 'p',
  help: 'Amount of time to wait between updates (seconds).',
  default: 30,
})
.option('peers', {
  abbr: 'P',
  help: 'Etcd peers to query.',
})
.parse();

function parseEtcdPeersString(s) {
  return s.split(',')
  .map(function(peer) {
    return peer.replace(/^http:\/\//, '').replace(/\/$/, '');
  });
}

var etcdPeers;
if (opts.peers) {
  etcdPeers = parseEtcdPeersString(opts.peers);
} else if (process.env.ETCDCTL_PEERS) {
  etcdPeers = parseEtcdPeersString(process.env.ETCDCTL_PEERS);
} else {
  etcdPeers = ['127.0.0.1:4001'];
}
console.log('Using Etcd peers:', etcdPeers.join(', '));
var etcd = new Etcd(etcdPeers);


function getKey() {
  return '/hosts/' + os.hostname();
}

function etcdCb(res) {
  if (res && res.errors) {
    res.errors.forEach(function(e) {
      console.error(e.httperror);
    });
    console.error('Could not set value in etcd.');
    process.exit(2);
  }
}

function updateEtcd() {
  var ip = getIp(opts.interface);
  etcd.set(getKey(), ip, {ttl: opts.ttl}, etcdCb);
}

console.log('Adding host key', getKey());
updateEtcd();
var updateInterval = setInterval(updateEtcd, opts.period * 1000);

// Start reading from stdin so we don't exit.
process.stdin.resume();

process.on('SIGINT', function() {
  console.log('Removing host key', getKey());
  clearInterval(updateInterval);
  etcd.del(getKey(), function(res) {
    etcdCb(res);
    process.exit(0);
  });
});

function getIp(dev) {
  var net_if = os.networkInterfaces()[dev];
  if (net_if === undefined) {
    throw 'Could not find network interface "' + dev + '".';
  }
  for (var i = 0; i < net_if.length; i++) {
    if (net_if[i].family === 'IPv4' && !net_if[i].internal) {
      return net_if[i].address;
    }
  }
  throw 'No IPv4 address available on network interface "' + dev + '".';
}
