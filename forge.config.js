const path = require('path')

module.exports = {
    "packagerConfig": {
        "name": "baibai",
        "appCopyright": "百百",
        "icon": path.join(__dirname, "src/icon.ico"),
        "overwrite": true
    },
    "makers": [
        {
            "name": "@electron-forge/maker-squirrel",
            "config": {
                "iconUrl": path.join(__dirname, "src/img/baibai.ico"),
                "loadingGif": path.join(__dirname, "src/img/loading.gif")
            }
        },
        {
            "name": "@electron-forge/maker-deb",
            "config": {
                "icon": path.join(__dirname, "src/icon.ico"),
                "iconUrl": path.join(__dirname, "src/img/baibai.ico"),
            }
        },
        {
            "name": "@electron-forge/maker-rpm",
            "config": {
                "icon": path.join(__dirname, "src/img/baibai.ico"),
                "loadingGif": path.join(__dirname, "src/img/loading.gif")
            }
        }
    ]
}