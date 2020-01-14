/***
 Copyright 2013 Teun Duynstee

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */
var firstBy = (function() {

  function identity(v){return v;}

  function ignoreCase(v){return typeof(v)==="string" ? v.toLowerCase() : v;}

  function makeCompareFunction(f, opt){
    opt = typeof(opt)==="number" ? {direction:opt} : opt||{};
    if(typeof(f)!="function"){
      var prop = f;
      // make unary function
      f = function(v1){return !!v1[prop] ? v1[prop] : "";}
    }
    if(f.length === 1) {
      // f is a unary function mapping a single item to its sort score
      var uf = f;
      var preprocess = opt.ignoreCase?ignoreCase:identity;
      f = function(v1,v2) {return preprocess(uf(v1)) < preprocess(uf(v2)) ? -1 : preprocess(uf(v1)) > preprocess(uf(v2)) ? 1 : 0;}
    }
    if(opt.direction === -1) return function(v1,v2){return -f(v1,v2)};
    return f;
  }

  /* adds a secondary compare function to the target function (`this` context)
   which is applied in case the first one returns 0 (equal)
   returns a new compare function, which has a `thenBy` method as well */
  function tb(func, opt) {
    var x = typeof(this) == "function" ? this : false;
    var y = makeCompareFunction(func, opt);
    var f = x ? function(a, b) {
      return x(a,b) || y(a,b);
    }
      : y;
    f.thenBy = tb;
    return f;
  }
  return tb;
})();