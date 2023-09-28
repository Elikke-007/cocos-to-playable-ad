// 新的资源载入方式脚本

/** 官网范例,反正看不懂
 * - https://developer.mozilla.org/zh-CN/docs/Web/API/WindowBase64/Base64_encoding_and_decoding#Solution_1_%E2%80%93_JavaScript's_UTF-16_%3E_base64
 */
function b64ToUint6(nChr) {
  return nChr > 64 && nChr < 91
    ? nChr - 65
    : nChr > 96 && nChr < 123
    ? nChr - 71
    : nChr > 47 && nChr < 58
    ? nChr + 4
    : nChr === 43
    ? 62
    : nChr === 47
    ? 63
    : 0;
}

/** 官网范例+1,看不懂+1,作用是将base64编码的字符串转为ArrayBuffer */
function base64DecToArr(sBase64, nBlockSize) {
  var sB64Enc = sBase64.replace(/[^A-Za-z0-9\+\/]/g, ""),
    nInLen = sB64Enc.length;
  var nOutLen = nBlockSize
    ? Math.ceil(((nInLen * 3 + 1) >>> 2) / nBlockSize) * nBlockSize
    : (nInLen * 3 + 1) >>> 2;
  var aBytes = new Uint8Array(nOutLen);
  for (
    var nMod3, nMod4, nUint24 = 0, nOutIdx = 0, nInIdx = 0;
    nInIdx < nInLen;
    nInIdx++
  ) {
    nMod4 = nInIdx & 3;
    nUint24 |= b64ToUint6(sB64Enc.charCodeAt(nInIdx)) << (18 - 6 * nMod4);
    if (nMod4 === 3 || nInLen - nInIdx === 1) {
      for (nMod3 = 0; nMod3 < 3 && nOutIdx < nOutLen; nMod3++, nOutIdx++) {
        aBytes[nOutIdx] = (nUint24 >>> ((16 >>> nMod3) & 24)) & 255;
      }
      nUint24 = 0;
    }
  }
  return aBytes;
}

cc.assetManager.downloader.register(".json", (url, options, complete) => {
  if (url.indexOf("assets") < 0) {
    url = "assets/" + url;
  }
  complete(null, JSON.parse(window.res[url]));
});
cc.assetManager.downloader.register(".plist", (url, options, complete) => {
  if (url.indexOf("assets") < 0) {
    url = "assets/" + url;
  }
  complete(null, window.res[url]);
});
cc.assetManager.downloader.register(".png", (url, options, complete) => {
  if (url.indexOf("assets") < 0) {
    url = "assets/" + url;
  }
  var img = new Image();
  img.src = "data:image/png;base64," + window.res[url]; // 注意需要给base64编码添加前缀
  complete(null, img);
});
cc.assetManager.downloader.register(".jpg", (url, options, complete) => {
  if (url.indexOf("assets") < 0) {
    url = "assets/" + url;
  }
  var img = new Image();
  img.src = "data:image/jpeg;base64," + window.res[url];
  complete(null, img);
});
cc.assetManager.downloader.register(".webp", (url, options, complete) => {
  if (url.indexOf("assets") < 0) {
    url = "assets/" + url;
  }
  var img = new Image();
  img.src = "data:image/webp;base64," + window.res[url];
  complete(null, img);
});
cc.assetManager.downloader.register(".mp3", (url, options, complete) => {
  if (url.indexOf("assets") < 0) {
    url = "assets/" + url;
  }
  cc.sys.__audioSupport.context.decodeAudioData(
    base64DecToArr(window.res[url]).buffer,
    // success
    function (buffer) {
      complete(null, buffer);
    },
    // fail
    function (buffer) {
      complete(new Error("mp3-res-fail"), null);
    }
  );
});
cc.assetManager.downloader.register(".js", (url, options, complete) => {
  if (url.indexOf("assets") < 0) {
    url = "assets/" + url;
  }
  console.log("Register .js", url, window.res[url] !== undefined);

  var d = document,
    s = document.createElement("script");
  "file:" !== window.location.protocol && (s.crossOrigin = "anonymous");
  s.async = options.async;
  s.type = "text/javascript";
  s.text = window.res[url];
  function loadHandler() {
    s.parentNode.removeChild(s);
    s.removeEventListener("load", loadHandler, false);
    s.removeEventListener("error", errorHandler, false);
    // complete && complete(null);
  }
  function errorHandler() {
    s.parentNode.removeChild(s);
    s.removeEventListener("load", loadHandler, false);
    s.removeEventListener("error", errorHandler, false);
    // complete && complete(new Error(cc.debug.getError(4928, url)));
  }
  s.addEventListener("load", loadHandler, false);
  s.addEventListener("error", errorHandler, false);
  d.body.appendChild(s);  

  complete && complete(null);
});
cc.assetManager.downloader.register(
  "bundle",
  (nameOrUrl, options, complete) => {
    var bundleName = cc.path.basename(nameOrUrl);
    var url = nameOrUrl;
    var version =
      options.version || cc.assetManager.downloader.bundleVers[bundleName];

    // load json
    var js =
      "assets/" + url + "/index." + (version ? version + "." : "") + "js";
    cc.assetManager.downloader.download(
      Date.now().toString(),
      js,
      ".js",
      {},
      () => {
        // load config
        var config =
          "assets/" +
          url +
          "/config." +
          (version ? version + "." : "") +
          "json";
        var out = JSON.parse(window.res[config]);
        out.base = "assets/" + url + "/";
        complete(null, out);
      }
    );
  }
);
