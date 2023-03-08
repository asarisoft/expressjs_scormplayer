(function () {
  window.simplifyScorm.jsonFormatter = jsonFormatter;
  window.simplifyScorm.xmlToJson = xmlToJson;

  /**
   * Converts data structures to JSON
   *
   * @returns {json}
   */
  function jsonFormatter() {
    this.jsonString = true;
    delete this.toJSON;

    var jsonValue = JSON.stringify(this);

    delete this.jsonString;
    this.toJSON = jsonFormatter;

    var returnObject = JSON.parse(jsonValue);
    delete returnObject.jsonString;

    for (var key in returnObject) {
      if (returnObject.hasOwnProperty(key) && key.indexOf("_") === 0) {
        delete returnObject[key];
      }
    }

    return returnObject;
  }

  // Changes XML to JSON
  function xmlToJson(xml) {
    // Create the return object
    var obj = {};

    if (xml.nodeType == 1) {
      // element
      // do attributes
      if (xml.attributes.length > 0) {
        obj["@attributes"] = {};
        for (var j = 0; j < xml.attributes.length; j++) {
          var attribute = xml.attributes.item(j);
          obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
        }
      }
    } else if (xml.nodeType == 3) {
      // text
      obj = xml.nodeValue;
    }

    // do children
    if (xml.hasChildNodes()) {
      for (var i = 0; i < xml.childNodes.length; i++) {
        var item = xml.childNodes.item(i);
        var nodeName = item.nodeName;
        if (typeof obj[nodeName] == "undefined") {
          obj[nodeName] = xmlToJson(item);
        } else {
          if (typeof obj[nodeName].push == "undefined") {
            var old = obj[nodeName];
            obj[nodeName] = [];
            obj[nodeName].push(old);
          }
          obj[nodeName].push(xmlToJson(item));
        }
      }
    }
    return obj;
  }
})();
