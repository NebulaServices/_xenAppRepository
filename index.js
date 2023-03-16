var fs = require('fs/promises');
var { readFileSync } = require('fs');
var http = require('http');
var path = require('path');
var mime = require('mime');
var { v5: uuid } = require('uuid');

var __PKG_META = [];

var sessions = [];

function createDownloadSession(id, time) {
  var _id = uuid(time.toString() + id, uuid.URL);
  sessions.push([id, _id]);
  return _id;
}

function validateSession(id, session) {
  if (sessions.find(e => e[0] == id && e[1] == session)) return true;
  return false;
}

var server = http.createServer();

function returnInvalidRequest(res, msg, err) {
  return res.writeHead(500, { 'x-xen-error': err || '', 'Access-Control-Allow-Origin': '*' }).end(msg);
}

async function loadMeta() {
  var data = (await fs.readFile('./meta', 'utf-8')).split('\n').map(e => e.split('='));

  return data;
}

async function createDownloadStream(id, response) {
  try {
    __PKG_META = await loadMeta();
  
    console.log(id)
  
    if (!id) return returnInvalidRequest(response, 'ID Must be provided in Request body. Download Aborted.');
    var _path = (__PKG_META.find(e => e[0] == id) || [null, null])[1];
  
    if (!_path) return returnInvalidRequest(response, 'Path Invalid or Not Found. Make Sure This Repository Exists. Download Aborted.');
  
    var dir = await fs.readdir(path.join(__dirname, _path));
  
    if (!dir.includes('manifest.json')) return returnInvalidRequest(response, 'Package Contains Invalid or Unreachable "manifest.json" File. Download Aborted.');
  
    var meta = await fs.readFile(path.join(__dirname, _path, 'manifest.json'), 'utf-8');
  
    try {
      meta = JSON.parse(meta);
    } catch (e) {
      return returnInvalidRequest(response, 'Package Meta is Invalid or Blank. Download Aborted', e);
    }
  
    meta.date = new Date().getTime();
    meta.id = id;
    meta.session = createDownloadSession(id, meta.date);
  
    return response.writeHead(200, { 'Access-Control-Allow-Origin': '*', 'content-type': 'application/json' }).end(JSON.stringify(meta));
  } catch(e) {
    return returnInvalidRequest(response, e.toString());
  }
}

async function sendDownloadChunk(id, asset, response) {
  try {
    if (!id || !asset) return returnInvalidRequest(response, 'ID and Asset Must be provided in Request body. Download Aborted.');
    var _path = (__PKG_META.find(e => e[0] == id) || [null, null])[1];
  
    if (!_path) return returnInvalidRequest(response, 'Path Invalid or Not Found. Make Sure This Repository Exists. Download Aborted.');
  
    var data = await fs.readFile(path.join(__dirname, _path, asset));
    
    return response.writeHead(201, { 'Access-Control-Allow-Origin': '*', 'Content-Type': mime.getType(asset) }).end(data);
  } catch(e) {
    return returnInvalidRequest(response, e.toString());
  }
}

async function clearDownloadSession(session, response) {
  try {
    if (!session) return returnInvalidRequest(response, 'Session Must be provided in Request body. Download Aborted.');
  
    var index = sessions.findIndex(e => e[1] == session);
  
    if (index == -1) return returnInvalidReponse(response, 'Session not found. Could be previously terminated.');
  
    sessions.splice(index, 1);
  
    return response.writeHead(200, { 'Access-Control-Allow-Origin': '*' }).end('true');
  } catch(e) {
    return returnInvalidRequest(response, e.toString());
  }
}

async function sendPackageVersion(id, response) {
  try {
    __PKG_META = await loadMeta();
  
    if (!id) return returnInvalidRequest(response, 'ID Must be provided in Request body. Download Aborted.');
    var _path = (__PKG_META.find(e => e[0] == id) || [null, null])[1];
  
    if (!_path) return returnInvalidRequest(response, 'Path Invalid or Not Found. Make Sure This Repository Exists. Download Aborted.');
  
    var dir = await fs.readdir(path.join(__dirname, _path));
  
    if (!dir.includes('manifest.json')) return returnInvalidRequest(response, 'Package Contains Invalid or Unreachable "manifest.json" File. Download Aborted.');
  
    var meta = await fs.readFile(path.join(__dirname, _path, 'manifest.json'), 'utf-8');
  
    try {
      meta = JSON.parse(meta);
    } catch (e) {
      return returnInvalidRequest(response, 'Package Meta is Invalid or Blank. Download Aborted', e);
    }
  
    return response.writeHead(200, { 'Access-Control-Allow-Origin': '*', 'content-type': 'text/plain' }).end(meta.version);
  } catch(e) {
    return returnInvalidRequest(response, e.toString());
  }
}

loadMeta().then(async (e) => {

  __PKG_META = e;

  server.on('request', function(req, res) {
    var chunks = [];
    var final = '';

    req.on('data', (e) => chunks.push(e)).on('end', async () => {
      final = Buffer.concat(chunks).toString(); if (final) try { final = JSON.parse(final); } catch (e) { console.log(e) };
      if (req.url == '/ip') {
        return res.end(req.headers['x-forwarded-for']?.split(',').shift() || req.socket?.remoteAddress);
      }
      
      if (req.url == '/') {
        loadMeta().then(e => {
          var obj = {};

          e.forEach(a=>obj[a[0]]=readFileSync(path.join(__dirname, a[1], 'manifest.json')).toString());
          
          return res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(Object.values(obj)));
        });
      }
      if (req.method == 'POST' && req.url == '/stream') {
        return await createDownloadStream(final.id || false, res)
      }
      if (req.method == 'POST' && req.url == '/version') {
        return await sendPackageVersion(final.pkg || false, res)
      }
      if (req.method == 'POST' && req.url == '/download' && validateSession(final.id, final.session)) {
        return await sendDownloadChunk(final.id || false, final.asset || false, res);
      }
      if (req.method == 'POST' && req.url == '/clear') {
        return await clearDownloadSession(final.session || false, res);
      }
    })
  });

  server.listen(8080);

}).catch(e => console.log(e));