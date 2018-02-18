/**
 * EVENTS:
 * atajo:update:initialized
 * atajo:update:filesystem:ready
 * atajo:update:folder:ready
 * atajo:update:error
 * atajo:update:download:success
 * atajo:update:download:error
 * atajo:update:download:progress
 * atajo:update:unzip:success
 * atajo:update:unzip:error
 * atajo:update:unzip:progress
 * atajo:update:file:remove:success
 * atajo:update:file:remove:error
 * atajo:update:file:get:error
 */


var update = {

    localFolderBase: 'atajo-code-update',
    localFolder: '',
    fileSystemURL: null,
    fileSystem: null,
    unzipQueue: [],
    downloadQueue: [],
    fileObjects: [],
    fileObjectInProgress: null,
    fileObjectInUnzipProgress: null,
    wifiOnly: false,
    autoUnzip: true,
    autoRemove: true,
    autoCheck: false,
    noMedia: true,
    loading: false,
    unzipping: false,
    initialized: false,
    transfer: null,
    retry: 3,
    http: null,
    apiUrl: 'https://api.atajo.io',
    updateDomain: 'atajo-code-update',

    debug: function(message) {
        console.debug("ATAJO:UPDATE -> ", message);
    },

    error: function(message) {
        console.error("ATAJO:UPDATE -> ", message);
    },

    createEvent: function(name, data) {

        data = data || [];
        var event = document.createEvent("Event");
        event.initEvent(name);
        event.name = name;
        event.data = data;
        var log = name;
        if (data[0]) log += " : " + data[0];
        return event;

    },

    check: function(domain, restartOnUpdate, persistUpdate) {

        if (!domain) return update.error("INVALID DOMAIN. PLEASE PASS AN ATAJO DOMAIN TO CHECK UPDATES FOR");

        update.domain = domain;
        update.restartOnUpdate = restartOnUpdate || false;
        update.persistUpdate = persistUpdate || true;

        update.init();
        update.getManifest(function(manifest) {

            console.debug("GOT MANIFEST : ", manifest);

            //GET CURRENT HASH
            update.checkHash(manifest.hash, function(updateHash) {

                if (updateHash) {
                    update.debug("HASH NOT FOUND. GETTING LATEST UPDATE");
                    update.getFilesystem(updateHash, function() {
                        update.getPackage(updateHash, function(entry) {
                            update.unzip(entry.name, function(location) {
                                update.saveHash(updateHash);
                                update.saveLocation(location);
                                if (update.restartOnUpdate) {
                                    update.debug("RESTARTING IN 2 SECONDS")
                                    setTimeout(function() {
                                        window.location = location;
                                    }, 2000);
                                }
                            });
                        })
                    });
                } else {
                    update.debug("CODE IS UP TO DATE");
                }

            })



        });


    },

    restart: function() {

        update.getLocation(function(location) {
            window.location = location;
        });

    },

    clearLatest: function() {
        update.storage.remove('atajo.code.update.hash');
        update.storage.remove('atajo.code.update.location');
    },

    checkHash: function(latestHash, callback) {

        update.storage.getItem('atajo.code.update.hash', function(currentHash) {

            update.debug("DOES CURRENT HASH (" + currentHash + ") == LATEST HASH (" + latestHash + ")");
            if (currentHash == latestHash) {
                update.debug("HASHES MATCH");
                callback(false)
            } else {
                update.debug("HASHES DO NOT MATCH");
                callback(latestHash);
            }

        }, function(error) {

            callback(latestHash);

        })


    },

    saveHash: function(hash, callback) {
        update.debug("SAVING HASH (" + hash + ") AS LATEST");
        callback = callback || function() {}
        update.storage.setItem('atajo.code.update.hash', hash, function() {

            callback();

        }, function(error) {

            callback(error);

        })

    },

    saveLocation: function(location, callback) {
        update.debug("SAVING LOCATION (" + location + ") AS LATEST");
        callback = callback || function() {}
        update.storage.setItem('atajo.code.update.location', location, function() {

            callback();

        }, function(error) {

            callback(error);

        })

    },

    getLocation: function(callback) {
        callback = callback || function() {}
        update.storage.getItem('atajo.code.update.location', function(location) {

            callback(location);

        }, function(error) {

            callback(false);

        })

    },

    init: function(callback) {

        if (update.initialized) return update.debug("ALREADY INITIALIZED");


        update.http = cordova.plugin.http || false;
        if (!update.http) return update.error("HTTP PLUGIN NOT FOUND. CANNOT CONTINUE");

        update.storage = NativeStorage;
        if (!update.storage) return update.error("STORAGE PLUGIN NOT FOUND. CANNOT CONTINUE");

        update.debug("INITIALIZING");

        if (!update.persistUpdate) { update.clearLatest(); }

    },


    getManifest: function(callback) {

        var manifestUrl = update.apiUrl + '/' + update.updateDomain + '/v1/manifest';
        update.debug("FETCHING MANIFEST FROM " + manifestUrl + " FOR DOMAIN " + update.domain);
        update.http.get(manifestUrl, {}, { 'domain': update.domain }, function(response) {

            try {
                response = JSON.parse(response.data);
                update.debug(response);
                if (response.error) {
                    console.error("ERROR FETCHING MANIFEST : ", response)
                } else {
                    callback(response.response.data);
                }

            } catch (e) {
                console.error("COULD NOT PARSE RESPONSE FROM UPDATE SERVER : ", e);
            }

        }, function(response) {
            console.error(response.error);
        });




    },

    getPackage: function(hash, callback) {

        var packageUrl = update.apiUrl + '/' + update.updateDomain + '/v1/package/' + hash + '.zip';
        update.debug("FETCHING PACKAGE FROM " + packageUrl + " FOR DOMAIN " + update.domain);

        var filePath = update.localFolder.toURL() + "/" + hash + '.zip';
        update.transfer = new FileTransfer();
        update.transfer.onprogress = function(progressEvent) {
            if (progressEvent.lengthComputable) {
                var percentage = Math.floor(progressEvent.loaded / progressEvent.total * 100);
                update.debug("DOWNLOADED " + percentage + "%");
                document.dispatchEvent(update.createEvent("atajo:update:download:progress", [percentage, hash]));
            }
        };
        update.transfer.download(packageUrl, filePath, function(entry) {
                document.dispatchEvent(update.createEvent("atajo:update:download:success", [entry]));
                callback(entry);
            }, function(error) {
                // console.log("transferFile, error file name: " + Downloader.fileObjectInProgress.name);

                document.dispatchEvent(update.createEvent("atajo:update:download:error", [error]));
            },
            false, { headers: { domain: update.domain } });

    },

    unzip: function(fileName, callback) {
        var folderUrl = update.localFolder.toURL();
        update.debug("UNZIPPING TO : " + folderUrl);
        zip.unzip(folderUrl + "/" + fileName, folderUrl, function(code) {
            if (code == 0) {
                update.debug("UNZIP DONE FOR : " + folderUrl);
                if (update.autoRemove) {
                    update.removeFile(fileName);
                }
                callback(folderUrl + 'index.html');
                document.dispatchEvent(update.createEvent("atajo:update:unzip:success", [fileName]));
            } else {
                update.error("UNZIP ERROR (" + code + ") FOR : " + folderUrl);
                document.dispatchEvent(update.createEvent("atajo:update:unzip:error", [fileName]));
            }
        }, function(progressEvent) {
            var percentage = Math.floor(progressEvent.loaded / progressEvent.total * 100);
            update.debug("UNZIPPED " + percentage + "%");
            document.dispatchEvent(update.createEvent("atajo:update:unzip:progress", [percentage, fileName]));
        });
    },

    getFilesystem: function(hash, callback) {

        window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem) {
            document.dispatchEvent(update.createEvent("atajo:update:filesystem:ready", [fileSystem.root]));
            update.fileSystem = fileSystem.root;
            update.getFolder(fileSystem.root, update.localFolderBase + '/' + hash, callback);

        }, function(error) {
            document.dispatchEvent(update.createEvent("atajo:update:error", [error]));
        });

    },

    getFolder: function(fileSystem, folderName, callback) {

        update.debug("GET FOLDER : " + folderName);

        fileSystem.getDirectory(folderName, {
                create: true,
                exclusive: false
            }, function(folder) {
                //console.log("getFolder->Success:" + folder.fullPath + " : " + folder.name);
                document.dispatchEvent(update.createEvent("atajo:update:folder:ready", [folder]));
                update.localFolder = folder;
                if (update.noMedia) {
                    update.touchNoMedia();
                }
                //console.log("initialized " + Downloader.localFolder.toURL());
                document.dispatchEvent(update.createEvent("atajo:update:initialized"));
                callback();
            },
            function(error) {
                //console.log("getFolder->Error");
                document.dispatchEvent(update.createEvent("atajo:update:error", [error]));
            });
    },

    touchNoMedia: function() {
        var folder = update.localFolder;
        folder.getFile(".nomedia", {
            create: true,
            exclusive: false
        }, function onTouchNoMediaFile(entry) {

        }, function onTouchNoMediaFileError(error) {
            document.dispatchEvent(createEvent("atajo:update:file:get:error", [error]));
        });
    },

    isZipFile: function(fileName) {
        if (fileName.match(/\.zip$/)) {
            return true;
        }
        return false;
    },

    removeFile: function(fileName) {
        var folder = update.localFolder;
        folder.getFile(fileName, {
            create: false,
            exclusive: false
        }, function onGotFileToRemove(entry) {
            entry.remove(function onRemoved() {
                document.dispatchEvent(update.createEvent("atajo:update:file:remove:success", [entry]));
            }, function onRemoveError() {
                document.dispatchEvent(update.createEvent("atajo:update:file:remove:error", [entry]));
            });
        }, function onGetFileError(error) {
            document.dispatchEvent(update.createEvent("atajo:update:file:get:error", [error]));
        });
    },

    events: {



        onCheckSuccess: function(event) {
            //var md5 = /** @type {String} */ event.data[0];
            var fileName = event.data[1];
            //console.log("CHECKED: " + md5 + ":" + fileName);
            if (update.autoUnzip && update.isZipFile(fileName)) {
                update.unzip(fileName);
            }
        }




    }

}


module.exports = update;