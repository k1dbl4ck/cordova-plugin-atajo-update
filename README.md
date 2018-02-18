# Atajo Code Update
Cordova plugin to remote update cordova code

## Installation
```
$ cordova plugin add https://github.com/k1dbl4ck/cordova-plugin-atajo-update.git
```

## Alternative Installation Option (Depending on Cordova version)
```
$ cordova plugin add https://github.com/k1dbl4ck/cordova-plugin-atajo-update.git --nofetch
```

## Usage

A minimal interface is exposed on the `window` object : 

```
atajo.update.check(domain, restartOnUpdate, persistUpdate); 
```

- domain - Your registered Atajo domain 
- restartOnUpdate - If an update is downloaded, the app will automatically restart with the updated code [default: false]
- persistUpdate - Useful when debugging. Passing false will cause updates to be pulled and loaded (if restartOnUpdate is also true) - but will load the compiled (default) code on the next restart [default: true]


## Events

Various events are dispatched during an update cycle, and can be subscribed to like so : 

```javascript
document.addEventListener(eventName, (event) => {
  var data = event.data;
});
```
 
 Event Names : 

 * atajo:update:initialized           data:none
 * atajo:update:filesystem:ready      data:[cordova.fileSystem fileSystem]
 * atajo:update:folder:ready          data:[cordova.fileEntry folder]
 * atajo:update:error                 data:[object error]
 * atajo:update:download:success      data:[cordova.fileEntry entry]
 * atajo:update:download:error        data:[object error]
 * atajo:update:download:progress     data:[number percentage]
 * atajo:update:unzip:success         data:[string fileName]
 * atajo:update:unzip:error           data:[string fileName]
 * atajo:update:unzip:progress        data:[number percentage, string fileName]
 * atajo:update:file:remove:success   data:[cordova.fileEntry entry]
 * atajo:update:file:remove:error     data:[cordova.fileEntry entry]
 * atajo:update:file:get:error        data:[object error]	



## Roadmap
- Switching between or rolling back to any previous update
- Delta syncing only files that have been updated. 

## Changelog

### Version 0.0.1
- Initial working plugin
