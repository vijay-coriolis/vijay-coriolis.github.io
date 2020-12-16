/*
 * intialises an internal data object to maintain hashes
 *
 * parameters
 *    tag - simply a string that can be used to identify this instance
 *    threshold - bucket entires will be at least this similar
 *    goodness - hashes will have at least this % of 1s and 0s
 */
function CuA(tag, threshold, goodness) {
  this.tag = tag;
  this.threshold = threshold;
  this.goodness = goodness;
  /*
   * data structure
   * [
   *   [ <avhash1>, [<urlStr-A>, ...] [<avhash1>, ...]],
   *   ...
   * ]
   */
  this.data = [];

  /*
   * helper function to return an idxObj
   *   - index : null or index of bucket
   *   - similarity : 0 - 100
   */
  this.idxObj = function(idx, sim) {
      return {index: idx, similarity: sim};
  };

  /*
   * finds the bucket that matches a given hash the best.
   * parameters
   *    hash - the hash to match
   *    threshold - the minimum acceptable similarity
   *
   * returns
   *    an object a, where a.index is the idx of the bucket, and if
   *    it is not null, a.similarity gives the similarity of the match
   *
   *    null [not an idvObj object] if the hash was bad
   */
  this.findBestBucket = function(hash, defaults) {
      var goodness_l, threshold_l;
      try {
        goodness_l = defaults.goodness;
      } catch (err) {
        goodness_l = this.goodness;
      }
      try {
        threshold_l = defaults.threshold;
      } catch (err) {
        threshold_l = this.threshold;
      }

      if (!hash.goodP(goodness_l)) {
          return null;
      }
      return this.data.reduce(function(acc, e, c) {
          var sim = hash.similarity(e);
          if (sim > acc.similarity) {
                //console.log("CuA:findBestBucket():info : found match");
                acc.similarity = sim;
                acc.index = c;
          }
          return acc;
      }, this.idxObj(null, threshold_l));
  };

  /*
   * add a hash to CUA and returns the bucket index
   *
   * parameters
   *    hash - AvHash to be added
   *    threshold - similarity required to be added to
   *                an existing bucket.  if 0, use default
   *                threshold value from CUA
   *    urlList - optional, list of URLs associated with the bucket
   *
   * returns
   *     an idxObj - {index: idx, similarity: 0 - 100} to
   *            the bucket either added or found
   *
   *      null otherwise
   */
  this.addHashEntry =  function(hash, url, defaults) {
      var goodness_l, threshold_l;
      //try {
      //  goodness_l = defaults.goodness;
      //} catch (err) {
        goodness_l = this.goodness;
      //}
      //try {
      //  threshold_l = defaults.threshold;
      //} catch (err) {
        threshold_l = this.threshold;
      //}

      if (!hash.goodP(goodness_l)) {
          return null;
      }
      try {
          var urlList =  (url)?[url]:[];
          var fbb = this.findBestBucket(hash,
              {"threshold": threshold_l, "goodness": goodness_l});
          if (fbb.index) {
              //console.log("CuA:addBucket():info : " +
              //    "Updating existing bucket");
              //This currently does not make a lot of sense, so if hashes are similar,
              //we ignore the one that comes later.
              //this.updateBucket(fbb.index, [hash], urlList);
              return fbb;
          }
          //console.log("CuA:addBucket():info : adding bucket");
          this.data.push(hash);
          return this.idxObj(this.data.length - 1, 0);
      } catch(err) {
          console.log("CuA:addBucket:warning : " + err);
          return null;
      }
  };


  /*
   * getBucketingHashes gets the hashes that were used for bucketing
   *
   * parameters
   * none
   *
   * returns
   *    Array of all bucketinh AvHashes
   */

   this.getBucketingHashes = function () {
       return this.data.map(x => x[0]);
   }

  /*
   * update (can only add) values within a bucket entry
   *
   * parameters
   *    idx - index of the bucket being updated
   *    hashList - a list of hashes belonging to the bucket
   *    urlList - optional, list of URLs associated with the bucket
   *
   * returns
   *    index of bucket updated on success
   *    null on failure
   */
  this.updateBucket =  function(idx, hashList, urlList) {
      try {
          //console.log("CuA:updateBucket():info: index " + idx);
          entry = this.data[idx];
          if (urlList.length) { // concat urlList
              //console.log("CuA:updateBucket():info: url >" +
              //  urlList + "<");
              entry[1] = entry[1].concat(urlList);
          }
          if (hashList) { // concat hashList
              //console.log("CuA:updateBucket():info: hashes " +
              //  hashList);
              entry[2] = entry[2].concat(hashList);
          }
          return idx;
      } catch(err) {
          console.log("CuA error: " + err);
          return null;
      }
  };

  /*
   * removes a bucket from the CuA
   * returns nothing
   */
  this.deleteBucket = function(idx) {
      try {
          this.data.splice(idx, 1);
      } catch(err) {
          console.log("CuA error: " + err);
      }
      return;
  };


  var loadImage = (imageUrl) => {
      return new Promise((resolve, reject) => {
          let image = new Image();
          image.onload = () => {

              resolve(image);
          };
          image.onerror = () => {
              reject("Error: Unable to load image");
          };
          image.src = imageUrl;
      });
  };

  function findMostProbableSite(sites){
      let max = null;
      for (key in sites){
          if (sites.hasOwnProperty(key)) {
              if (max == null){
                  max = key;
                  continue;
              }
              if (sites[key] > sites[max]) {
                  console.log(sites[key]);
                  max = key;
              }
          }

      }
      return max;
  }

  this.GenCuaForScreenShot = function(screenShot){
      return loadImage(screenShot).then(image => {
          let pubCuA = new CuA("public", 90, 32);
          for(var i in [0, 1]) { // traverse row|col major
              //for(j=0; j<15; j++) { //scanArea
              for(var j in [0, 1, 2]) { // scanArea
                  hash = avHash(image,
                      {width:16, height:12}, // dim
                      {traverse: i, scanArea: j}) // mode

                  pubCuA.addHashEntry(hash, null,
                      {
                      goodness: goodness[j],
                      threshold: threshold[j]
                      });
              }
          }
          console.log("pubCUA found : ", pubCuA);
          return pubCuA;
      });
  };

  this.findBucketForScreenshot = function( prevRes, screenShot) {
          return loadImage(screenShot).then(image => {
              if (prevRes != null)
              {
                  return prevRes;
              }
              var res = null;
              for(var i in [0, 1]) { // traverse row|col major
                  for(var j in [0, 1, 2]) { // scanArea
                      hash = avHash(image,
                          {width:16, height:12}, // dim
                          {traverse: i, scanArea: j}) // mode
                      res = this.findBestBucket(hash,
                          {
                          goodness: 32,
                          threshold: 85
                          });
                      if (res && res.index != null){
                          break;
                      }

                  }
              }

              if (res && res.index != null)
              {
                  console.log(res);
                  var bestSite = findMostProbableSite(this.data[res.index].site);
                  console.log(bestSite);
                  if (bestSite != null) {
                      return ({type : "custom", site : bestSite});
                  }
              }
              else {
                  return null;
              }
          });
  };
}

/*
* constructor for AvHash
* expected to be used directly only by avHash()
*
* parameters
*    arr - array of unsigned32 integers to initialise the hash
*/
function AvHash(arr) {
  this.site = {};
  this.type = "AvHash";
  this.length = arr.length;
  this.buf = new ArrayBuffer(this.length * 4);
  this.view = new Uint32Array(this.buf);
  this.src = {
      filename : undefined,
      traverse : undefined,
      scanArea : undefined
  };
  this.taxTravTbl = {
      0: {
          1: 20
          },
      1: {
          0: 20
          }
    };
  this.taxScanTbl = {
      0: {
          1: 20,
          2: 20
          },
      1: {
          0: 20,
          2: 20
          },
      2: {
          0: 20,
          1: 20
          }
   };
  this.disTax = 10;

  // initialise the hash value from the array of integers supplied
  for (var i = 0; i < arr.length; i++) {
      this.view[i] = arr[i];
  }

  function hamming(h1, h2) {
      var h = 0,
          d = h1 ^ h2;

      // d - initialised to hold 1s in positions h1 & h2 differ
      // h - the hamming distance, set to 0

      while ( d != 0 ) {
          h++;          // increment distance
          d &= d-1;     // remove the rightmost 1
      }

      //console.log(h);
      return h;
  }

  /*
   * validates "goodness" of a hash
   *
   * parameters
   *    num - percentage of 1s or 0s minimally required
   *          in the range 0 - 50
   * returns
   *    boolean
   */
  this.goodP = function(num) {
      var hashLen = this.length * 4 * 8;
      var minBits = Math.floor(hashLen * num / 100);

      console.assert(minBits <= hashLen / 2, "bad goodness check");
      var bits = this.view.reduce(function(a,b) {
              return a + hamming(b, 0);
          }, 0);
      var ret = (bits >= minBits && bits <= (hashLen - minBits))?
          true : false;
      //console.assert( ret, "AvHash:goodP():warning : bad quality hash" +
      //  "(" + bits + ")");
      return ret;
  };

  this.distance = function(h) {
      var f = Math.floor;
      console.assert(h.type == "AvHash", "Not an AvHash object");
      console.assert(this.length == h.length, "Incompatible hashes");
      try {
          var dist,
              tax = 0,
              bits = this.view.length * 32;

          if (this.src.traverse != h.src.traverse) {
              try {
                  tax += this.taxTravTbl[this.src.traverse][h.src.traverse];
                  //console.log("special Trav Tax >" +
                  //  AvHash.taxTrav[this.src.scanArea]
                  //    [h.src.scanArea] + "<" );
              } catch (err) {
                  tax += this.disTax;
                  //console.log("default trav disTax >" +
                  //  AvHash.disTax + "<" );
              }
          }
          if (this.src.scanArea != h.src.scanArea) {
              try {
                  tax += this.taxScanTbl
                      [this.src.scanArea][h.src.scanArea];
                  //console.log("special scan Tax >" +
                  //  AvHash.taxScanTbl[this.src.scanArea]
                  //    [h.src.scanArea] + "<" );
              } catch (err) {
                  tax += this.disTax;
                  //console.log("default scan disTax >" +
                  //  AvHash.disTax + "<" );
              }
          }
          tax = f(bits * tax / 100);

          var i;
          for (dist = tax, i = 0; i < this.view.length ; i++) {
             dist += hamming(this.view[i], h.view[i]);
          }
          return (dist > bits)? bits : dist;
      } catch(err) {
          console.log("AvHashError : " + err);
          return 0;
      }
  };

  this.equalP = function(h) {
      return (this.distance(h) == 0) ? true : false;
  };
  this.similarity = function(h) {
      var bits = this.length * 4 * 8;
      var dist = this.distance(h);
      var temp = (bits - this.distance(h)) * 100 / bits;
      return (bits - this.distance(h)) * 100 / bits;
  };
  this.similarP = function(h, threshold) {
      if (!threshold) {
        threshold = this.threshold;
      }
      return this.similarity(h) > threshold;
  };

  this.toString = function() {
      return this.view.reduce(function(a, b) {
              return a + ", " + b;
          }, "");
  };
}

/*
* avSimilarP - predicate to check if hashes are similar
* parameters
*    h1, h2 : hashes (from avHash) to compare
*    threshold : tunable that controls exactness of match in percentage
*
* returns
*    true if similarity of hashes h1 and h2 is greater than threshold
*    false otherwise
*/
var avSimilarP = function(h1, h2, threshold) {
  return h1.similarP(h2, threshold);
};

/*
* avSimilarity - returns percentage similarity given two avHashes
* parameters
*    h1, h2 : hashes (from avHash) to compare
*
* returns percentage of similarity
*/
var avSimilarity = function(h1, h2) {
  return h1.similarity(h2);
};

/*
* avHashDist - calculate hamming distance between two avHashes
* parameters
*    h1, h2 : hashes (objects of type AvHash) to compare
*
* returns an integer in the range 0 - h1.length * 4 * 8
*/
var avHashDist = function(h1, h2) {
  return h1.distance(h2);
};

/*
* convert a grayscale image to black & white image
*
* parameters
*    vals - array of integers representing grayscale image
*
* return
*    array of integers corresponding to the a B&W image
*/
function makeBoW(vals) {
  // get the avg pixel intensity for the image

  var avg = vals.reduce(function(a,b) {
          return a + b;
      }, 0) / vals.length;

  // use it to map pixels to either 0 or 1
  return vals.map(function(a) { return a > avg ? '1' : '0'; });
}


// now calculate the hash
function hashIt(binVal) {
  var res = [];
  var s,  // current start offset
      e,  // current end offset
      r;  // max offset

  for(s=0, r=binVal.length, e=(r > s+32)? s+32 : r;
      s < r; s = e, e = (r > s+32)? s+32 : r) {
      //console.log("s : " + s + ", e : " + e);
      res.push(binVal.slice(s,e).reduce(function(a,b,c) {
              return a + b * 2 ** c;
          }, 0));
  }

  return new AvHash(res);
}

/*
* avHash8x8 - call avHash() with the width & height parameters set to 8x8
* parameters
*    img - image to be hashed
*
* returns - AvHash object for the image
*/
var avHash8x8 = function(img) {
  return avHash(img, {width:8, height:8}, {traverse: 0, scanArea :0});
};

/*
* avHash - calculates an average based hash for an image
* parameters
*    img - image to be hashed
*    dim.width,height - size of the target image img is reduced to before
*        hashing.
*    mode.traverse - direction of traversal,
*        0 - row major,
*        1 - column major
*    mode.scanArea - what to scan in the image
*        0 - default, all of the pic
*        1 - middle of the pic
*        2 - top left quadrant
*        3 - top right quadrant
*        4 - bottom left quadrant
*        5 - bottom right quadrant
*        6 - top left third
*        7 - top middle third
*        8 - top right third
*        9 - mid left third
*        10 - mid middle third
*        11 - mid right third
*        12 - bot left third
*        13 - bot middle third
*        14 - bot right third
*
* returns - hash of the image in an AvHash object
*/
var avHash = function(img, dim, mode) {

  // console.log("image width : " + img.width);
  // console.log("image height : " + img.height);

  var canvas = document.createElement('canvas'),
  ctx = canvas.getContext('2d');

  console.assert(((dim.width *  dim.height) % 32 == 0),
      "avHash :error: cannot hash img with dim =>" +
      dim.width + " x " + dim.height + "<");
  canvas.width = dim.width;
  canvas.height = dim.height;

  // handle antialiasing
  ctx.mozImageSmoothingEnabled = false;
  ctx.webkitImageSmoothingEnabled = false;
  ctx.msImageSmoothingEnabled = false;
  ctx.imageSmoothingEnabled = false;


  var f = Math.floor;
  var iw = img.width,
      ih = img.height;
  var scanAreas = [
      [0, 0, iw, ih],  // whole
      [iw>>2, ih>>2, iw - iw>>2, ih - ih>>2], // middle
      [0, 0, iw>>1, ih>>1], // top-left
      [iw>>1 + 1, 0, iw, ih>>1], // top-right
      [0, ih>>1 + 1, iw>>1, ih], // bot-left
      [iw>>1 + 1, ih>>1 + 1, iw, ih], // bot-right
      [0, 0, f(iw/3), f(ih/3)], // top left third
      [f(iw/3)+1, 0, f(2*iw/3), f(ih/3)], // top mid third
      [f(2*iw/3)+1, 0, iw, f(ih/3)], // top right third
      [0, f(ih/3)+1, f(iw/3), f(2*ih/3)], // mid left third
      [f(iw/3)+1, f(ih/3)+1, f(2*iw/3), f(2*ih/3)], // mid mid third
      [f(2*iw/3)+1, f(ih/3)+1, iw, f(2*ih/3)], // mid right third
      [0, f(2*ih/3)+1, f(iw/3), ih], // bot left third
      [f(iw/3)+1, f(2*ih/3)+1, f(2*iw/3), ih], // bot mid third
      [f(2*iw/3)+1, f(2*ih/3)+1, iw, ih], // bot right third

  ];

  var loopLimits = [
      // [ inner, outer, colM, rowM ],
      [dim.width, dim.height, dim.width, 1], // row major
      [dim.height, dim.width, 1, dim.height] // column major
  ];

  var isa = scanAreas[mode.scanArea];   // isa -> Image Source Area
  isa[2] = isa[2] - isa[0];
  isa[3] = isa[3] - isa[1];
  // image resized, with anti-aliasing and rendered onto canvass
  ctx.drawImage(img,
              isa[0], isa[1], isa[2], isa[3],
              0, 0, dim.width, dim.height);

  var im = ctx.getImageData(0, 0, dim.width, dim.height);
  // im.data is an array of RGBA values; A=0(transparent),255(opaque)
  // i.e. there are 4 channels of info per pixel

  // Convert image to grayscale
  var num_channels = 4,
      vals = new Array(dim.width * dim.height);

  // fix traversal order ...
  var loopLimit = loopLimits[mode.traverse];
  //console.log("loopLimit : " + loopLimit);
  for(var i = 0, dest = 0; i < loopLimit[1]; i++) {
      for(var j = 0; j < loopLimit[0]; j++, dest++) {
          var base = num_channels * (loopLimit[2] * i + loopLimit[3] * j);

          // note, the python code equivalent ignores the aplha channel
          // however, we are setting the pixel value to white if alpha == 0
          if (im.data[base+3]  == 0) {
              vals[dest] = 255;
              continue;
          }

          // When translating a color image to black and white
          // (using mode "L"  the python library uses the
          // ITU-R 601-2 luma transform:
          //    L = R * 299/1000 + G * 587/1000 + B * 114/1000
          //
          vals[dest] =
              Math.floor(0.229 * im.data[base] +
              0.587 * im.data[base + 1] +
              0.114 * im.data[base + 2] + 0.5);
      }
  }

  // increase contrast making it BoW ...
  var binVal = makeBoW(vals);
  // now hash it
  var hash = hashIt(binVal);

  // annotate hash with src data
  //hash.src.filename = img.currentSrc; //Makes no sense from plugin perspective
  hash.src.scanArea = mode.scanArea;
  hash.src.traverse = mode.traverse;

  return hash;

};