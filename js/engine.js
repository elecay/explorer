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
*   - https://wiki.mozilla.org/WebAPI/DeviceStorageAPI
*/


(function () {

    SDCARD = "sdcard";
    filesToImport = [];
    folders = [];
    root = "";
    isBacking = false;
    foldersAdded = [];

    storage = navigator.getDeviceStorage(SDCARD);

    refreshBtn = document.querySelector("#refreshBtn");
    refreshBtn.addEventListener ('click', function () {
      load();
    });

    backhBtn = document.querySelector("#backBtn");
    backhBtn.addEventListener ('click', function () {
      back();
    });

    load();

    function back(){
      folders = root.split("/");
      folders.splice(folders.length - 1, 1)
      root = folders.join("/");
      load();
    }

    function load(){

      alreadyAdded = [];
      if(root == ""){
        backhBtn.style.display = 'none';
      } else {
        backhBtn.style.display = 'block';
      }

      root_ = document.querySelector("#root_path");
      root_.innerHTML = root;

      $('#item-list li').remove();
      var all_files = storage.enumerate(root); 
      
      all_files.onsuccess = function() {
       
        foldersToSort = [];
        filesToSort = [];
        sizes = [];
        while (all_files.result)  {
           var each_file = all_files.result;
          n = each_file.name.split("/");
          if(n.length == 1) {
            filesToSort.push(n[0] + " - " + (each_file.size/1000000).toFixed(2) + "MB");
          } else {
            foldersToSort.push(n[0]);
          }
          all_files.continue(); 
        }

        filesToSort.sort();
        foldersToSort.sort();

        for (var g = 0; g < foldersToSort.length; g++)  {
          path = foldersToSort[g].split("/");
          if(alreadyAdded.lastIndexOf(path[0] + "/") == -1) {
            alreadyAdded.push(path[0] + "/");
            $("#item-list").prepend('<li><label><input type="checkbox"><span class="folder"></span>'
              + '</label>' + path[0] + "/" + '</li>');
          }
        }
        for (var f = 0; f < filesToSort.length; f++)  {
          path = filesToSort[f].split("/");
          $("#item-list").append('<li><label><input type="checkbox"><span class="file"></span>'
            + '</label>' + path + '</li>');
        }
        flagError = true;
        flagOk = true;

        $('#item-list').click(function(event) {
          var target = $(event.target);
           if(flagOk){
            if(target.text().split("/").length > 1){
              if(!isBacking){
                if(root == ""){
                  root = target.text().substring(0, target.text().lastIndexOf('/'));
                }else{
                  root = root + "/" + target.text().substring(0, target.text().lastIndexOf('/'));
                }
              }
              load();
            } else {
              console.log("File to share: " + target.text());
              importFiles(target.text().split(" -")[0]);
            }
            flagOk = false;
          }
        });
      };
      isBacking = false;
    }

    function importFiles(filesToImport) {

          a_file = (root == "") ? storage.get(filesToImport) : a_file = storage.get(root + "/" + filesToImport); 

          a_file.onerror = function() {
            var afterNotification = function(){
              Lungo.Router.section("main");
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
            blob = a_file.result;
            item = new Object();
            item.isVideo = true,
            item.filename = blob.name,
            item.blob = blob
            //to share with the email we have to do this (ugly)
            var type = 'image/*';
            var nameonly = item.filename.substring(item.filename.lastIndexOf('/') + 1);
            var activity = new MozActivity({
              name: 'share',
              data: {
                type: type,
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
          };
    }

})();