var fs = require('fs');
var path = require('path');


function convert(file) {
  // remove version that is not being used or updated
  delete file.version;

  function traverse(obj) {
    for (i in obj) {
      if (!!obj[i] && typeof(obj[i])=="object") {
        // there is __compat, but sub features follow, "support" should always be the next key
        if (obj[i].hasOwnProperty("__compat") && !obj[i].__compat.support) {
          let newObj = {};
          for (let feature of Object.keys(obj[i].__compat)) {
              // change desc to description and ensure it is added at the top (thus O.assign)
              if (obj[i].__compat[feature].desc) {
                obj[i].__compat[feature] = Object.assign({description: obj[i].__compat[feature].desc}, obj[i].__compat[feature]);
                delete obj[i].__compat[feature].desc;
              }
              // basic_support is now __compat on the main feature level
              if (feature == 'basic_support') {
                newObj.__compat = obj[i].__compat.basic_support;
              } else {
                // former sub features need to have __compat too
                newObj[feature] = {"__compat": obj[i].__compat[feature]};
              }
          }
          obj[i] = newObj;
        }
        traverse(obj[i]);
      }
    }
  }
  traverse(file.data.api);

  console.log(JSON.stringify(file, null, 2));
}


function load(...files) {
  for (let file of files) {
    if (file.indexOf(__dirname) !== 0) {
      file = path.resolve(__dirname, '..', file);
    }

    if (fs.statSync(file).isFile()) {
      if (path.extname(file) === '.json') {
        console.log(file.replace(path.resolve(__dirname, '..') + path.sep, ''));
        convert(require(file));
      }

      continue;
    }

    let subFiles = fs.readdirSync(file).map((subfile) => {
      return path.join(file, subfile);
    });

    load(...subFiles);
  }
}

load(process.argv[2])
