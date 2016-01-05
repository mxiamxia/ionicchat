/**
 * Created by mxia on 11/9/2015.
 */
app.factory('Users', function () {
        return {
            all: function () {
                var userString = window.localStorage['users'];
                if (userString) {
                    return angular.fromJson(userString);
                }
                return [];
            },
            save: function (users) {
                window.localStorage['users'] = angular.toJson(users);
            },
            getLastActiveIndex: function () {
                return parseInt(window.localStorage['lastActiveUser']) || 0;
            },
            setLastActiveIndex: function (index) {
                window.localStorage['lastActiveUser'] = index;
            }
        }
    })
    .factory('Record', function ($q, SPEECH_RUL) {

        var enumerator = 0;
        var recordName = 'record-' + enumerator + '.wav';
        var mediaRec = null;
        var fileURL = null;

        /**
         * Start a record
         *
         * @method startRecord
         */
        function startRecord() {
            enumerator++;
            recordName = 'record-' + enumerator + '.wav';
            mediaRec = new Media(recordName,
                function () {
                },
                function (err) {
                });
            mediaRec.startRecord();
        }

        /**
         * Stop record
         *
         * @method stopRecord
         */
        function stopRecord() {
            mediaRec.stopRecord();
        }

        /**
         * Stop record
         *
         * @method stopRecord
         */
        //function playRecord() {
        //    mediaRec.play();
        //}

        /**
         * Get the name of the record
         *
         * @method getRecord
         */
        function getRecord() {
            return recordName;
        }

        /**
         * Save the recorded file to the server
         *
         * @method save
         */
        function save() {
            console.log('start to save');
            var defer = $q.defer();
            function gotFS(fileSystem) {
                fileSystem.root.getFile(recordName, {
                    create: true,
                    exclusive: false
                }, gotFileEntry, fail);
            }

            function gotFileEntry(fileEntry) {
                fileURL = fileEntry.toURL();
                console.log('get file URL' + fileURL);
                defer.resolve({data:fileURL});
            }

            window.requestFileSystem(LocalFileSystem.TEMPORARY, 0, gotFS, fail);
            return defer.promise;
        }


        /**
         * When any process of saving file fail, this console the error.
         *
         * @method OnFileEntry
         */
        function fail(err) {
            console.log('Error');
            console.log(err);
        }

        /**
         * Play record
         *
         * @method playRecord
         */
        function playRecord() {
            var mediaFile = new Media(recordName,
                function () {
                    console.log("playAudio():Audio Success");
                    mediaFile.release();
                },
                function (err) {
                    console.log("playAudio():Audio Error: " + err);
                }
            );
            // Play audio
            mediaFile.play();
        }

        var uploadAudio = function () {
            console.log('file url = ' + fileURL);
            var defer =  $q.defer();
            var win = function (r) {
                console.log("Code = " + r.responseCode);
                console.log("Response = " + r.response);
                console.log("Sent = " + r.bytesSent);
                defer.resolve({
                    data: r.response
                })
            }

            var fail = function (error) {
                alert("An error has occurred: Code = " + error.code);
                console.log("upload error source " + error.source);
                console.log("upload error target " + error.target);
            }

            var options = new FileUploadOptions();
            options.fileKey = "file";
            options.fileName = recordName;
            options.mimeType = "audio/wav";

            var ft = new FileTransfer();
            ft.upload(fileURL, encodeURI(SPEECH_RUL), win, fail, options);
            return defer.promise;
        }

        return {
            start: startRecord,
            stop: stopRecord,
            play: playRecord,
            name: getRecord,
            save: save,
            upload: uploadAudio
        };
    });

