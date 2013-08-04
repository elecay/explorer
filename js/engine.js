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

  isPicking = false;
  activityRequest = "";

  function runApp() {

    SDCARD = "sdcard";
    filesToImport = [];
    folders = [];
    root = "";
    isBacking = false;
    foldersAdded = [];

    refreshBtn = document.querySelector("#refreshBtn");
    refreshBtn.addEventListener ('click', function () {
      load();
    });

    backhBtn = document.querySelector("#backBtn");
    backhBtn.addEventListener ('click', function () {
      back();
    });

    storage = navigator.getDeviceStorage(SDCARD);

    function back(){
      isBacking = true;
      folders = root.split("/");
      folders.splice(folders.length - 1, 1)
      root = folders.join("/");
      load();
    }

    function load(){

      foldersToSort = [];
      filesToSort = [];
      pathsToSort = [];
      sizes = [];

      alreadyAdded = [];
      if(root == ""){
        backhBtn.style.display = 'none';
      } else {
        backhBtn.style.display = 'block';
      }

      root_ = document.querySelector("#path_root");
      root_.innerHTML = '<label><span class="home"></span></label>' + root;

      $('#item-list li').remove();
      var cursor = storage.enumerate(root); 

      cursor.onsuccess = function() {
        if (!cursor.result)  {
          execute();
          return; 
        }

         var file = cursor.result;
        var prefix = "/" + SDCARD + "/";
        if (root != "") {
           prefix += root + "/";
        }
        var fname = file.name.replace(prefix, "");
        if(file.name.split("/").length > 1){
          pathsToSort.push(fname);
        } else {
          filesToSort.push(fname + " - " + (file.size / 1000000).toFixed(2) + "Mb");
        }
        cursor.continue(); 
      }

      function execute() {

        filesWithImage = ['doc', 'xls', 'ppt', 'psd', 'ai', 'pdf', 'html', 'xml', 'txt', 'mp3', 'jpg', 'png', 'zip'];

        pathsToSort.sort(
          function(a, b) {
            if (a.toLowerCase() < b.toLowerCase()) return -1;
            if (a.toLowerCase() > b.toLowerCase()) return 1;
            return 0;
          }
          );
        filesToSort.sort(
          function(a, b) {
            if (a.toLowerCase() < b.toLowerCase()) return -1;
            if (a.toLowerCase() > b.toLowerCase()) return 1;
            return 0;
          }
          );

        for (var s = 0; s < pathsToSort.length; s++)  {
          n = pathsToSort[s].split("/");
          if(n.length == 1) {
            filesToSort.push(n[0]);
          } else {
            foldersToSort.push(n[0]);
          }
        }

        for (var g = 0; g < foldersToSort.length; g++)  {
          path = foldersToSort[g].split("/");
          if(alreadyAdded.lastIndexOf(path[0] + "/") == -1) {
            alreadyAdded.push(path[0] + "/");
            $("#item-list").append('<li><label><input type="checkbox"><span class="folder"></span>'
              + '</label>' + path[0] + "/" + '</li>');
          }
        }
        for (var f = 0; f < filesToSort.length; f++)  {
          path = filesToSort[f].split("/");
          fileType = path.toString().substring(0, path.toString().lastIndexOf(' -')).split(".")[1];
          if(filesWithImage.indexOf(fileType) == -1){
            fileType = 'unk';
          }
          $("#item-list").append('<li><label><input type="checkbox"><span class="' + fileType + '"></span>'
            + '</label>' + path + '</li>');
        }

        flagOk = true;

        $('#item-list li').click(function(event) {
          var target = $(event.target);
          if(flagOk && target.text() != ""){
            if(target.text().split("/").length > 1){
              if(!isBacking){
                if(root == ""){
                  root = target.text().substring(0, target.text().lastIndexOf('/'));
                } else {
                  root = root + "/" + target.text().substring(0, target.text().lastIndexOf('/'));
                }
              }
              load();
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
      };
      isBacking = false;
    }

    load();

    function importFiles(filesToImport) {

      a_file = (root == "") ? storage.get(filesToImport) : a_file = storage.get(root + "/" + filesToImport); 

      a_file.onerror = function() {
        var afterNotification = function(){
          Lungo.Router.section("main");
          load();
        };
        Lungo.Notification.error(
          "Sorry!",
          "We can't find a file in your SDCARD (or you have to unplug your phone).",
          "warning",
          5,
          afterNotification
          );
        console.error("Error in: ", a_file.error.name);
      };

      a_file.onsuccess = function() { 

        if(isPicking){
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

          activity.onerror = function(e) {
            console.warn('Share activity error:', activity.error.name);
            load();
          };

          activity.onsuccess = function(e) {
            load();
          }
        }
      };
    }
  }

  runApp();

  navigator.mozSetMessageHandler('activity', function(activityReq) {
    activityRequest = activityReq;
    var option = activityRequest.source;

    if (option.name === "pick") {
      isPicking = true;
    }
  });

})();

