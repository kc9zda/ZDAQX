var http = require("http");
var fs = require("fs");
var formidible = require("formidable");

var httpsrv = http.createServer(on_request);
var uploads = [];

function get_file_size(path) {
    var stats = fs.statSync(path);
    return stats.size;
}

function save_upload_list() {
    var s = JSON.stringify(uploads);

    fs.writeFileSync("zdaqx.dat",s);
}

function load_upload_list() {
    var s = fs.readFileSync("zdaqx.dat");

    uploads = JSON.parse(s);
}

function prune(c) {
    var fn;
    for (var i=0;i<uploads.length;i++) {
        if (uploads[i].code == c) {
            fn = "zdaqx_tmp/"+uploads[i].code+"_"+uploads[i].path;
            if (fs.existsSync(fn)) fs.unlinkSync(fn);
            uploads.splice(i,1);
            return;
        }
    }
}

function prune_uploads() {
    var a = [];

    for (var i=0;i<uploads.length;i++) {
        if (uploads[i].time+86400e3 <= Date.now()) {
            a.push(uploads[i].code);
        }
    }

    for (var i=0;i<a.length;i++) {
        prune(a[i]);
    }
    save_upload_list();
    if (a.length>0) console.log("Pruned "+a.length+" uploads");
}

function serve_page(s,f,t) {
    var vc;

	try {
        vc = fs.readFileSync(f);
        if (t!=undefined) {
            s.setHeader("Content-Type",t);
        }
		s.end(vc);
	} catch(e) {
		switch(e.code) {
			case "ENOENT":
				s.statusCode = 404;
				s.end("File Not Found");
				break;
			default:
				s.statusCode = 500;
				s.end("Internal Server Error");
				break;
		}
		console.log("serve_page: "+e.message);
	}
}

function generate_code() {
    var s = "";

    for (var i=0;i<5;i++) {
        s+=String.fromCharCode(0x61+(Math.random()*26));
    }
    return s;
}

function register_upload(c,p,t) {
    var o = {};

    o.code = c;
    o.path = p;
    o.time = Date.now();
    o.type = t;
    uploads.push(o);
    save_upload_list();
}

function handle_upload(q,s) {
    var f = new formidible.IncomingForm();
    f.parse(q,function(err,fields,files){
        var c = generate_code();
        var op = files.uf.path;
        var np = c+"_"+files.uf.name;
        var np2 = "zdaqx_tmp/"+np;
        fs.rename(op,np2,function(err) {
            if (err) {
                s.write("error uploading: "+err);
                s.end();
                return;
            }
            if (get_file_size(np2) > 10e6) {
                fs.unlinkSync(np2);
                s.write("<html>Your file is too large. Maximum file size 10MB<br><a href=\"/\">Return</a></html>");
                s.end();
            } else {
                register_upload(c,files.uf.name,files.uf.type);
                s.write("<html>File uploaded. Your code is <b>"+c+"</b><br><a href=\"/\">Return</a></html>");
                s.end();
            }
        })
    });
}

function code_exists(c) {
    for (var i=0;i<uploads.length;i++) {
        if (uploads[i].code==c) return true;
    }
    return false;
}

function get_real_filename(c) {
    for (var i=0;i<uploads.length;i++) {
        if (uploads[i].code==c) return uploads[i].path;
    }
}

function handle_download(q,s) {
    var f = new formidible.IncomingForm();
    f.parse(q,function(err,fields,files){
        var nu;

        if (!code_exists(fields.dc)) {
            s.write("<html>Code doesn't exist.<br><a href=\"/download\">Try again</a></html>");
            s.end();
            return;
        }
        nu = "/files/"+fields.dc+"/"+get_real_filename(fields.dc);
        s.write("<html>File found<br><a href=\""+nu+"\">Click here to download the file</a></html>");
        s.end();
    });
}

function get_file_type(c) {
    for (var i=0;i<uploads.length;i++) {
        if (uploads[i].code==c) return uploads[i].type;
    }
}

function handle_download2(q,s) {
    var sa = q.url.split("/");

    serve_page(s,"zdaqx_tmp/"+sa[2]+"_"+sa[3],get_file_type(sa[2]));
}

function on_request(q,s) {
    console.log(q.url);
    if (q.url == "/") {
        serve_page(s,"index.html");
        return;
    }
    if (q.url == "/download") {
        serve_page(s,"download.html");
        return;
    }
    if (q.url == "/download_files") {
        handle_download(q,s);
        return;
    }
    if (q.url.startsWith("/files")) {
        handle_download2(q,s);
        return;
    }
    if (q.url == "/upload") {
        serve_page(s,"upload.html");
        return;
    }
    if (q.url == "/upload_files") {
        handle_upload(q,s);
        return;
    }
    s.writeHead(404,{'Content-Type':'text/html'});
    s.write("404");
    s.end();
}

if (!fs.existsSync("zdaqx_tmp")) {
    fs.mkdirSync("zdaqx_tmp");
}
if (fs.existsSync("zdaqx.dat")) {
    load_upload_list();
    prune_uploads();
}
httpsrv.listen(8628);
setInterval(prune_uploads,60e3);