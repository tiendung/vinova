(function () {
  var testNum = 0, correctNum = 0;
  function test(str, vi) {
    testNum++;
    vinova.raw = str;
    vinova.update();
    str = "Test #" + testNum + ": '" +vinova.raw+ "'=>'" + vinova.mix + "' equals '" + vi + "': ";
    if (vinova.mix === vi) {
      correctNum++;
      str += "PASS";
    } else  str += "FAIL";
    console.log(str);
  }
  
  console.log("Test tone positions:");

  console.log("finals ended with i or y");
  test("ôis","ối");
  test("ơir","ởi");
  test("aif","ài");
  test("oix","õi");
  test("âyj","ậy");
  test("ays","áy");

  console.log("finals ended with u, o");
  test("rươuj","rượu");
  test("iur","ỉu");
  test("ưus","ứu");
  test("aux","ãu");
  test("ÂUJ","ẬU");
  test("Êur","Ểu");
  test("taor","tảo");
  test("teof","tèo");
      
  console.log("finals ended with a");
  test("uyar","uỷa");
  test("mias","mía");
  test("nưas","nứa");
  test("cuar","của");
  test("uar","ủa");
  
  console.log("with onset is u");
  test("quar","quả");
  test("quơr","quở");
  test("quis","quí");
  
  console.log("Special cases");
  test("oanr", "oản");
  test("tuaans", "tuấn");
  test("gianr", "giản");
  test("gias", "giá");
/*
  test("", "");
*/  
  
  vinova.raw = vinova.mix = "";
  
  console.log("Total test: " + testNum + ", Passed: " + correctNum + ", Failed: " + (testNum - correctNum));
})();

jQuery( document ).ready( function () {
  var testCase = {
    "nghĩ"    : "4ng--i-",
    "hỏi"     : "3h--oo-j",
    "sang"    : "0s--a-ng",
    "nghiêng" : "0ng--iê-ng",
    "tuổi"    : "3t--uô-j",
    "chích"   : "1c--i-k",
    "cuồng"   : "2k--uô-ng",
    "choè"    : "2c-w-e-",
    "nghẹn"   : "5ng--e-n",
    "trắng"   : "1tr--ă-ng",
    "phong"   : "0f--oo-ng",
    "hưởng"   : "3h--ươ-ng",
    "biết"    : "1b--iê-t",
    "gì"      : "2z--i-",
    "buồn"    : "2b--uô-n",
    "chung"   : "0c--u-ng",
    "mình"    : "2m--i-ng",
    "hãy"     : "4h--ă-j",
    "kỷ"      : "3k--i-",
    "gìn"     : "2z--i-n",
    "giữ"     : "4z--ư-",
    "hành"    : "2h--ae-ng",
    "củ"      : "3k--u-",
    "xíu"     : "1x--i-w",
    "tiếc"    : "1t--iê-k",
    "xoăn"    : "0x-w-ă-n",
    "lưu"     : "0l--ư-w",
    "đau"     : "0d--ă-w",
    "tuển"    : "3t-w-ê-n",
    "quỵt"    : "5k-w-i-t",
    "lâng"    : "0l--â-ng",
    "aacs"    : "0--â-k",
    "giaacs"  : "1z--â-k",
    ""  : "",
    ""  : "",
    ""  : "",
    ""  : "",
    ""  : "",
    ""  : "",
    ""  : "0--"
  };
  
  var pass = 0, total = 0;
  vinova.toggle('log');
  for ( var prop in testCase ) {
    total++;
    var value = testCase[ prop ];
    var result = vinova.parseViSyllable( prop );
    if ( result.str === value ) { 
      pass++; 
    }
    console.log('"'+prop+'"', "is Vietnamese ->", result.pass, '."'+result.str+'"', "=", '"'+value+'"', result.str === value && "");
    console.log();
  }
  console.log("Pass: ", pass, ", Fail: ", total - pass, ", Total: ", total);
  vinova.toggle('log');
});