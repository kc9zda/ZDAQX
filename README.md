ZDAQX
=====

Version 1.0 - Nov 25, 2018

ZDAQX is a quick, anonymous HTTP file transfer server. The server runs on Node.JS and can be accessed through Chrome or Firefox. Files up to 10 MB may be uploaded, and will persist for 24 hours. After uploading, the user is given a 5 letter code to retrieve the file. The uploader then can give this code to anyone to download it from the same server. 

## How to run

The only prerequisite for this program is having a fairly recent version of Node.JS installed.

Simply download the code from Github and `cd` to the directory. Then run `node index.js` and the server will run. The default port is 8627.