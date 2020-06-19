const { app, ipcRenderer, clipboard, remote, shell } = require('electron');
const { BrowserWindow } = remote;
const path = require('path');
const fs = require('fs');
const md5 = require('md5');
const os = require('os');
const net = require('net');
const { machineIdSync } = require('node-machine-id');
const childprocess = require('child_process');
const log = require('electron-log');
const Config = require('electron-config');
const config = new Config();
const rooturl = 'http://192.168.0.100:8080/';

window.addEventListener('DOMContentLoaded', () => {

  // log path %USERPROFILE%\AppData\Roaming\{app name}\logs\{process type}.log
  // console.log = log.log;
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

  window.appinfo = {
    ostype: os.platform(),
    hostname: os.hostname(),
    sn: machineIdSync(),
    rooturl,
    apppath: __dirname,
    frp_admin_addr: config.get('frp_admin_addr'),
    frp_admin_port: config.get('frp_admin_port'),
    frp_check_admin_address: config.get('frp_check_admin_address'),
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

})

window.appruntime = {
  setAutorun(flag) {
    config.set('is_auto_run', flag ? "true" : "false");
    ipcRenderer.send('event-set-auto-run', flag);
  },
  openurl: function (url) {
    shell.openExternal(url);
  },
  proxy: function (list, isreload, callback) {
    fs.writeFileSync(__dirname + '/lib/loontunnelfrpc.ini', '');
    list.forEach((item) => {
      fs.appendFileSync(__dirname + '/lib/loontunnelfrpc.ini', item + os.EOL);
    });

    let frppath = null;
    if (isreload) {
      frppath = window.appinfo.apppath + "/lib/loontunnelfrpc reload -c " + window.appinfo.apppath + "/lib/loontunnelfrpc.ini";
    } else {
      frppath = window.appinfo.apppath + "/lib/loontunnelfrpc -c " + window.appinfo.apppath + "/lib/loontunnelfrpc.ini";
    }

    console.log('cmd', frppath);
    const lsfrpc = childprocess.exec(frppath, {
      windowsHide: true,
    });

    lsfrpc.stdout.on('data', (lsfrpcdata) => {
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
    require('child_process').exec("shutdown.exe -s -t 00");
  },
  hideapp: function () {
    ipcRenderer.send('event-app-window-hide', 'hideapp');
  },
  copystr: function (str) {
    clipboard.writeText(str);
  },
  findLib: function (name, callback) {
    const cmd = process.platform === 'win32' ? 'tasklist' : 'ps aux';

    if (process.platform === 'win32') {
      name = name + ".exe";
    }

    childprocess.exec(cmd, { windowsHide: true }, function (err, stdout, stderr) {

      const applist = stdout.split('\n');
      for (const index in applist) {
        const item = applist[index];
        let processMessage = item.trim().split(/\s+/)
        let processName = processMessage[0]
        if (processName === name) {
          callback(true);
          return;
        }
      }

      callback(false);
    })
  },
  stopLib: function (name, callback) {
    const cmd = process.platform === 'win32' ? 'tasklist' : 'ps aux';

    if (process.platform === 'win32') {
      name = name + ".exe";
    }

    childprocess.exec(cmd, { windowsHide: true }, function (err, stdout, stderr) {
      stdout.split('\n').filter((line) => {
        let processMessage = line.trim().split(/\s+/)
        let processName = processMessage[0]
        if (processName === name) {
          try {
            process.kill(processMessage[1]);
          } catch (error) {

          }
        }
      })

      if (callback === undefined) {
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
    const frppath = window.appinfo.apppath + "/lib/loonfrpc -c " + window.appinfo.apppath + "/lib/loonfrpc.ini";
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
  }
}
