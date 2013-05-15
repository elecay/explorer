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
    root = "";
    old_root = "";
    isBacking = false;

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
      root = old_root;
      isBacking = true;
      load();
    }

    function load(){

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
        while (all_files.result)  {
           var each_file = all_files.result;
          path = each_file.name.split("/");
          size = Math.round(each_file.size/1000);
          if(size >= 1000){
            size = Math.round(size/1000);
            size += "Mb";
          } else {
            size += "kb"
          }
          if(path.length == 1){
            $("#item-list").append('<li><label><input type="checkbox"><span class="file"></span>'
              + '</label>' + each_file.name + " - " + size + '</li>');
            flagError = true;
            flagOk = true;
          } else {
            //TODO: fix repeated folder
            $("#item-list").append('<li id="' + path[0] + '"><label><input type="checkbox"><span class="folder"></span>'
              + '</label>' + path[0] + "/" + '</li>');
          }
          
          all_files.continue(); 
        }

        $('#item-list').click(function(event) {
          var target = $(event.target);
           if(flagOk){
            
            if(target.text().split("/").length > 1){
              if(!isBacking){
                old_root = root;
              }
              root = target.text().substring(0, target.text().lastIndexOf('/'));
              load();
            } else {
              console.log("File to share: " + target.text());
              importFiles(target.text());
            }
            flagOk = false;
          }
        });
      };
      isBacking = false;
    }

    function importFiles(filesToImport) {

          a_file = storage.get("/" + root + filesToImport); 

          a_file.onerror = function() {
            var afterNotification = function(){
              Lungo.Router.section("main");
            };
            Lungo.Notification.error(
              "Sorry!",                                                                                   //Title
              "We can't find a file in your SDCARD (or you have to unplug your phone).",            //Description
              "warning",                                                                                  //Icon
              5,                                                                                          //Time on screen
              afterNotification                                                                           //Callback function
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