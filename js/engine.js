
(function () {

    SDCARD = "sdcard";
    filesToImport = [];
    root = "";

    storage = navigator.getDeviceStorage(SDCARD);

    refreshBtn = document.querySelector("#refreshBtn");
    refreshBtn.addEventListener ('click', function () {
      load();
    });

    load();

    function load(){

      shareBtn = document.querySelector("#shareBtn");
      $('#item-list li').remove();

      var all_files = storage.enumerate(""); 
      flagError = true;
      flagOk = true;
      all_files.onsuccess = function() {
        while (all_files.result)  {
           var each_file = all_files.result;
          
          $("#item-list").append('<li><label><input type="checkbox"><span></span>'
            + '</label>' + each_file.name + '</li>');
          all_files.continue(); 
        }
        
        if($('input[type="checkbox"]').size() == 0){
          if(flagError) {
            $("#item-list").append('<li id="addvCard">Ups! No files in the SDCARD.</li>');
            $('#shareBtn').removeClass('accept');
            $('#shareBtn').addClass('disabled');
            $("#pickvCard").remove();
            flagError = false;
          }
        } else {
          if(flagOk){
            flagOk = false;
            $("#item-list").prepend('<li id="pickvCard" class="dark">Please, pick one file to share.</li>');
            $("#addvCard").remove();
          }
          $('#shareBtn').removeClass('disabled');
          $('#shareBtn').addClass('accept');
          shareBtn.addEventListener('click', function () {
            Lungo.Router.section("progress");
            var filesToImport = $('input[type="checkbox"]:checked').map(function() {
              return $(this).parent().parent().text();
            }).get();
            importFiles(filesToImport);
          });
        }
      };

      all_files.onerror = function(){
        $('#shareBtn').removeClass('accept');
        $('#shareBtn').addClass('disabled');
      }
    }

    function importFiles(filesToImport) {

          //just the first one
          a_file = storage.get(filesToImport[0]); 
          console.log("File: " + a_file);

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
            var type = 'image/*';
            var nameonly = item.filename.substring(item.filename.lastIndexOf('/') + 1);
            var activity = new MozActivity({
              name: 'share',
              data: {
                type: type,
                number: 1,
                blobs: [item.blob],
                filenames: [nameonly],
                filepaths: [item.filename] /* temporary hack for bluetooth app */
              }
            });
            activity.onerror = function(e) {
              console.warn('Share activity error:', activity.error.name);
            };
          };
    }

})();