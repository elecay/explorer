/**
 * Explorer for FirefoxOS v0.1
 *
 * Copyright Sebastián Rajo 2013.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 *
 * References:
 *
 * - https://wiki.mozilla.org/WebAPI/DeviceStorageAPI
 */

(function () {

    var isPicking = false;
    var activityRequest = "";
    var DIRECTORY = "sdcard";

    function runApp() {
        
        var filesToImport = [];
        var folders = [];
        var root = "";
        var isBacking = false;
        var foldersAdded = [];
        var alert = document.querySelector('#alert');

        var refreshBtn = document.querySelector("#refreshBtn");
        refreshBtn.addEventListener('click', function () {
            checkAvailability(DIRECTORY);
        });

        var backhBtn = document.querySelector("#backBtn");
        backhBtn.addEventListener('click', function () {
            back();
        });

        // Open the default device storage
        var storage = navigator.getDeviceStorage(DIRECTORY);
        var storages = [];

        var deviceStoragesList = document.querySelector("#deviceStoragesList");
        // Check that getDeviceStorages is available (only for FxOS >=1.1)
        if (navigator.getDeviceStorages) {
            storages = navigator.getDeviceStorages(DIRECTORY);
            if (storages.length > 1) {
                // Display the dropdown list only if there are more than one device storage available
                deviceStoragesList.style.display = "block";
                for (var i = 0; i < storages.length; i++) {
                    var storageName = storages[i].storageName;
                    deviceStoragesList.options[i] = new Option(storageName, storageName);
                    if (storages[i].default === true) {
                        deviceStoragesList.options[i].selected = true;
                    }
                }
            }
            deviceStoragesList.addEventListener("change", function () {
                changeDeviceStorage(this.options[this.selectedIndex].value);
            });
        }


        function back() {
            isBacking = true;
            folders = root.split("/");
            folders.splice(folders.length - 1, 1)
            root = folders.join("/");
            checkAvailability(DIRECTORY);
        }

        /**
         * Check storage availability
         * @param {String} deviceStorageName Name of the device storage to check
         */ 
        function checkAvailability(deviceStorageName) {
            var storage = navigator.getDeviceStorage(deviceStorageName);
            var request = storage.available();

            request.onsuccess = function () {

                if (this.result == "available") {

                    load();
                    alert.innerHTML = '';
                    
                } else if(this.result == "unavailable") {

                    alert.setAttribute('data-l10n-id', 'device-not-available');
                    alert.setAttribute('data-l10n-args', '{"folder" : "' + DIRECTORY + '"}');

                } else {

                    alert.setAttribute('data-l10n-id', 'device-shared-not-available');
                    alert.setAttribute('data-l10n-args', '{"folder" : "' + DIRECTORY + '"}');

                }

            }
            
            request.onerror = function () {

                alert.setAttribute('data-l10n-id', 'device-space-retrieve-error');
                alert.setAttribute('data-l10n-args', '{"folder" : "' + DIRECTORY + '"}');

            }
        }

        /**
         * Switches to another device storage, based on the given name
         * @param {String} deviceStorageName Name of the device storage to switch to
         */
        function changeDeviceStorage(deviceStorageName) {
            for (var i = 0; i < storages.length; i++) {
                if (deviceStorageName === storages[i].storageName) {
                    storage = storages[i];
                    // Go back to the root of the device storage, and load its content
                    root = "";
                    checkAvailability(DIRECTORY);
                    return;
                }
            }
        }

        function load() {
            console.log("load");

            // Empty alert in case there was an error shown before.
            $('#alert').empty();

            var foldersToSort = [];
            var filesToSort = [];
            var pathsToSort = [];
            var sizes = [];

            var alreadyAdded = [];
            if (root == "") {
                backhBtn.style.display = 'none';
            } else {
                backhBtn.style.display = 'block';
            }

            var root_ = document.querySelector("#path_root");
            root_.innerHTML = '<label><span class="home"></span></label>' + root;

            $('#item-list li').remove();
            console.dir(storage);
            var cursor = storage.enumerate(root);

            cursor.onsuccess = function () {

                if (this.result) {
                    var file = cursor.result;
                    var prefix = "/" + storage.storageName + "/";
                    if (root != "") {
                        prefix += root + "/";
                    }
                    var fname = file.name.replace(prefix, "");
                    console.log('fname: ' + fname);
                    if (fname.split("/").length > 1) {
                        pathsToSort.push(fname);
                    } else {
                        filesToSort.push(fname + " - " + (file.size / 1000000).toFixed(2) + "Mb");
                    }
                    cursor.continue();
                } else {
                    console.log('no result');
                    execute();
                    return;
                }
            };

            function execute() {

                var filesWithImage = ['doc', 'xls', 'ppt', 'psd', 'ai', 'pdf', 'html', 'xml', 'txt', 'mp3', 'jpg', 'png', 'zip'];

                pathsToSort.sort(
                    function (a, b) {
                        if (a.toLowerCase() < b.toLowerCase()) return -1;
                        if (a.toLowerCase() > b.toLowerCase()) return 1;
                        return 0;
                    }
                );
                filesToSort.sort(
                    function (a, b) {
                        if (a.toLowerCase() < b.toLowerCase()) return -1;
                        if (a.toLowerCase() > b.toLowerCase()) return 1;
                        return 0;
                    }
                );

                for (var s = 0; s < pathsToSort.length; s++) {
                    console.log("tosort:" + pathsToSort[s]);
                    n = pathsToSort[s].split("/");
                    if (n.length == 1) {
                        filesToSort.push(n[0]);
                    } else {
                        foldersToSort.push(n[0]);
                    }
                }

                for (var g = 0; g < foldersToSort.length; g++) {
                    var path = foldersToSort[g].split("/");
                    if (alreadyAdded.lastIndexOf(path[0] + "/") == -1) {
                        alreadyAdded.push(path[0] + "/");
                        $("#item-list").append('<li><label><input type="checkbox"><span class="folder"></span>'
                        + '</label>' + path[0] + "/" + '</li>');
                    }
                }
                for (var f = 0; f < filesToSort.length; f++) {
                    var path = filesToSort[f].split("/");
                    var fileType = path.toString().substring(0, path.toString().lastIndexOf(' -')).split(".")[1];
                    if (filesWithImage.indexOf(fileType) == -1) {
                        fileType = 'unk';
                    }
                    $("#item-list").append('<li><label><input type="checkbox"><span class="' + fileType + '"></span>'
                    + '</label>' + path + '</li><span>d</span>');
                }

                var flagOk = true;

                $('#item-list li').click(function (event) {
                    var target = $(event.target);
                    if (flagOk && target.text() != "") {
                        if (target.text().split("/").length > 1) {
                            if (!isBacking) {
                                if (root == "") {
                                    root = target.text().substring(0, target.text().lastIndexOf('/'));
                                } else {
                                    root = root + "/" + target.text().substring(0, target.text().lastIndexOf('/'));
                                }
                            }
                            checkAvailability(DIRECTORY);
                        } else {
                            var fname = target.text();
                            if (fname.lastIndexOf(' -') >= 0) {
                                fname = fname.substring(0, fname.lastIndexOf(' -'))
                            }
                            console.log("File to share: " + fname);
                            importFiles(fname);
                        }
                        flagOk = false;
                    }
                });
            }

            isBacking = false;
        }

        // Check storage availability before doing load function
        checkAvailability(DIRECTORY);

        function importFiles(filesToImport) {

            var a_file = (root == "") ? storage.get(filesToImport) : storage.get(root + "/" + filesToImport);
            a_file.onerror = function () {
                var afterNotification = function () {
                    Lungo.Router.section("main");
                    checkAvailability(DIRECTORY);
                };
                Lungo.Notification.error(
                    "Sorry!",
                    "We can't find a file in your DIRECTORY (or you have to unplug your phone).",
                    "warning",
                    5,
                    afterNotification
                );
                console.error("Error in: ", a_file.error.name);
            };

            a_file.onsuccess = function () {

                var blob;
                var item;
                if (isPicking) {
                    isPicking = false;
                    activityRequest.postResult.type = a_file.result.type;
                    activityRequest.postResult({
                        type: a_file.result.type,
                        blob: a_file.result
                    });
                } else {
                    blob = a_file.result;
                    item = new Object();
                    item.isVideo = true;
                    item.filename = blob.name;
                    item.blob = blob;
                    var type = blob.type;
                    var nameonly = item.filename.substring(item.filename.lastIndexOf('/') + 1);
                    var activity = new MozActivity({
                        name: 'share',
                        data: {
                            // this is ugly; all share options with images are shown. But right now is the
                            // only way to share with the email.
                            type: 'image/*',
                            number: 1,
                            blobs: [item.blob],
                            filenames: [nameonly],
                            filepaths: [item.filename]
                        }
                    });

                    activity.onerror = function (e) {
                        console.warn('Share activity error:', activity.error.name);
                        checkAvailability(DIRECTORY);
                    };

                    activity.onsuccess = function (e) {
                        checkAvailability(DIRECTORY);
                    }
                }
            };
        }
    }

    runApp();

    navigator.mozSetMessageHandler('activity', function (activityReq) {
        activityRequest = activityReq;
        var option = activityRequest.source;

        if (option.name === "pick") {
            isPicking = true;
        }
    });

})();

