const { ipcRenderer, clipboard, remote, shell } = require('electron');
const { BrowserWindow } = remote;
const path = require('path');
const Buffer = require('buffer').Buffer;
const fs = require('fs');
const os = require('os');
const si = require('systeminformation');
const childprocess = require('child_process');
const log = require('electron-log');
const Config = require('electron-config');
const axios = require('axios');
axios.defaults.adapter = require('axios/lib/adapters/http');
const axios2 = require('axios');
const config = new Config();
const rooturl = 'http://192.168.0.100:8080/';

window.addEventListener('DOMContentLoaded', () => {

  // log path %USERPROFILE%\AppData\Roaming\{app name}\logs\{process type}.log
  console.log = log.log;
  log.transports.file.level = true;

  if (!config.get('log_console_level')) {
    config.set('log_console_level', 'false');
  } else {
    log.transports.console.level = (config.get('log_console_level') == 'true');
  }

  if (!config.get('rooturl')) {
    config.set('rooturl', rooturl);
  }

  if (!config.get('frp_admin_addr')) {
    config.set('frp_admin_addr', '127.0.0.1');
  }

  if (!config.get('frp_admin_port')) {
    config.set('frp_admin_port', '8102');
  }

  if (!config.get('frp_check_admin_address')) {
    config.set('frp_check_admin_address', 'http://127.0.0.1:');
  }

  if (!config.get('is_auto_run')) {
    config.set('is_auto_run', "true");
    window.appruntime.setAutorun(true);
  }

  si.uuid(function (resp) {
    readyapp(resp.os);
  });
})

function readyapp(uuid) {

  console.log('app sn:', uuid);
  window.appinfo = {
    ostype: os.platform(),
    hostname: os.hostname(),
    sn: uuid,
    apppath: __dirname,
    userpath: remote.app.getPath('userData'),
    rooturl: config.get('rooturl'),
    frp_admin_addr: config.get('frp_admin_addr'),
    frp_admin_port: config.get('frp_admin_port'),
    frp_check_admin_address: config.get('frp_check_admin_address'),
  }

  try {
    fs.statSync(window.appinfo.userpath + "/files");
  } catch (error) {
    fs.mkdir(window.appinfo.userpath + "/files", function (error) {
      if (error) {
        console.log(error);
      }
    });
  }

  authObj.init();
  tunnelObj.init();

  var interfaces = require('os').networkInterfaces();
  for (var devName in interfaces) {
    var iface = interfaces[devName];
    for (var i = 0; i < iface.length; i++) {
      var alias = iface[i];
      if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
        window.appinfo.ip = alias.address;
        return;
      }
    }
  }
}

window.appruntime = {
  async downloadFile(url, filePath, fileName, onprogress, onsuccess, onerror) {
    try {
      const mypath = path.resolve(filePath, fileName);
      const writer = fs.createWriteStream(mypath);
      const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream',
      });
      response.data.on('data', chunk => {
        onprogress(chunk.length);
      });
      response.data.pipe(writer);
      writer.on("finish", onsuccess);
      writer.on("error", onerror);
    } catch (error) {
      console.log(error);
      onerror(error);
    }
  },
  opendevtools() {
    ipcRenderer.send('event-open-devtools', '');
  },
  setRootUrl(url) {
    config.set('rooturl', url);
    console.log(window.appinfo.rooturl, url);
    window.appinfo.rooturl = url;
  },
  setAutorun(flag) {
    config.set('is_auto_run', flag ? "true" : "false");
    ipcRenderer.send('event-set-auto-run', flag);
  },
  openurl: function (url) {
    shell.openExternal(url);
  },
  showFolder: function (rootPath, fileName) {
    const fullpath = path.join(rootPath, fileName);
    shell.showItemInFolder(fullpath);
  },
  resettigervncpw: function (list, callback) {
    const temppath = __dirname + '/lib/usr/bin/makepw.sh';
    fs.writeFileSync(temppath, '');
    list.forEach((item) => {
      fs.appendFileSync(temppath, item + os.EOL);
    });

    const respexec = childprocess.exec(temppath, {
      windowsHide: true,
    });
    console.log('path temppath:', temppath);
    respexec.stdout.on('data', (resp) => {
      console.log('resettigervncpw resp:', resp);
      if (!callback) {
        return;
      }
      if (callback && resp.indexOf('success') != -1) {
        callback();
      }
    });
  },
  proxy: function (frpcname, list, isreload, callback) {
    fs.writeFileSync(__dirname + '/lib/loontunnelfrpc.ini', '');
    list.forEach((item) => {
      fs.appendFileSync(__dirname + '/lib/loontunnelfrpc.ini', item + os.EOL);
    });

    let frppath = null;
    if (isreload) {
      frppath = window.appinfo.apppath + "/lib/" + frpcname + " reload -c " + window.appinfo.apppath + "/lib/loontunnelfrpc.ini";
    } else {
      frppath = window.appinfo.apppath + "/lib/" + frpcname + " -c " + window.appinfo.apppath + "/lib/loontunnelfrpc.ini";
    }

    console.log('exec shell:', frppath);

    const lsfrpc = childprocess.exec(frppath, {
      windowsHide: true,
    });

    lsfrpc.stdout.on('data', (lsfrpcdata) => {
      console.log('exec proxy resp:', lsfrpcdata);
      if (callback && lsfrpcdata.indexOf('success') != -1) {
        callback();
      }
    });
  },
  showWindowShutdown: function (seconds) {
    window.localStorage.showWindowShutdownSeconds = seconds;
    const modalPath = path.join('file://', __dirname, './views/shutdown.html');
    let win = new BrowserWindow({
      frame: false, width: 350, height: 450,
      webPreferences: {
        nodeIntegration: true,
        enableRemoteModule: true,
      }
    });
    win.on('close', () => {
      win = null;
    });
    win.loadURL(modalPath);
    win.show();
  },
  config: {
    set: function (key, val) {
      config.set(key, val);
    },
    get: function (key) {
      return config.get(key);
    }
  },
  log: function (info) {
    log.info(info);
  },
  shutdown: function () {
    let shellstr = "shutdown.exe -s -t 00";
    if (process.platform === 'linux') {
      shellstr = "shutdown -h now";
    }
    require('child_process').exec(shellstr);
  },
  hideapp: function () {
    ipcRenderer.send('event-app-window-hide', 'hideapp');
  },
  copystr: function (str) {
    clipboard.writeText(str);
  },
  stopLib: function (name, callback) {
    const cmd = process.platform === 'win32' ? 'tasklist' : 'ps -ef | grep ' + name;

    if (process.platform === 'win32') {
      name = name + ".exe";
    }

    childprocess.exec(cmd, { windowsHide: true }, function (err, stdout, stderr) {

      const lines = stdout.split('\n');
      for (const line of lines) {
        try {
          if (!line) {
            continue;
          }
          let processMessage = line.trim().split(/\s+/)
          if (process.platform == "win32") {
            if (name === processMessage[0]) {
              try {
                process.kill(processMessage[1]);
              } catch (error) {
                console.log(error);
              }
            }
          }

          if (process.platform == "linux") {
            if (processMessage[7].indexOf(name) != -1) {
              try {
                console.log('kill', processMessage[1], processMessage[7]);
                childprocess.exec("kill " + processMessage[1] + " -9", { windowsHide: true });
              } catch (error) {
                console.log('error', error);
              }
            }
          }
        } catch (error) {
          console.log(error);
        }
      }

      if (callback == undefined) {
        return;
      }
      callback();
    })
  },
  resetpw: function (password, callback) {

    const setpasswdpath = window.appinfo.apppath + "/lib/setpasswd " + password + " " + password + "l";
    const pwls = require('child_process').exec(setpasswdpath, {
      windowsHide: true,
    });

    pwls.on('exit', (code) => {
      callback();
    });
  },
  startfrp: function (env, callback) {

    let frpname = "loonfrpc";
    if (process.platform === 'linux') {
      frpname = "linux-loonfrpc";
    }

    const frppath = window.appinfo.apppath + "/lib/" + frpname + " -c " + window.appinfo.apppath + "/lib/loonfrpc.ini";
    const lsfrpc = childprocess.exec(frppath, {
      env,
      windowsHide: true,
    });
    lsfrpc.stdout.on('data', (lsfrpcdata) => {
      console.log(lsfrpcdata);
      if (lsfrpcdata.indexOf("login to server success") != -1) {
        callback();
      }
    });
  },
  startvnc: function (callback) {
    const vncpath = window.appinfo.apppath + "/lib/loonvnc";
    childprocess.exec(vncpath, {
      windowsHide: true,
    });

    callback();
  },
  startlinuxvnc: function (callback) {
    const vncpath = window.appinfo.apppath + "/lib/usr/bin/x0vncserver -PasswordFile ~/.vnc/passwd";
    childprocess.exec(vncpath, {
      windowsHide: true,
    });

    callback();
  }
}
