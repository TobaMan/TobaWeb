
const TIMEOUTEVENT = -1;

var TobaHandle = 0;
var jsCallback =  Module.cwrap(
    "WebCallbackFunction", null, []);
var jsCallbackHandle =  Module.cwrap(
    "WebCallbackFunctionHandle", null, ["number"]);

var jsEvtList = [];

var jsLog = [];

var jsEvents = [
    "change",
    "click",
    "dblclick",
    "mouseover",
    "mouseout",
    "mouseenter",
    "mouseleave",
    "mousemove",
    "mouseup",
    "mousedown",
    "touchcancel",
	"touchend",
	"touchmove",
	"touchstart",
    "keydown",
    "animationend",
];

var ObjectReferences = {

};

function StoreObject(obj){
    var newid = Date.now().toString();
    ObjectReferences[newid] = obj;
    return newid;
}

function ObjectRef(item, fnc, args){
    var retvalue = 0;
    var obj = ObjectReferences[item];
    // if (obj[fnc] instanceof Function) { 
    //     fnc = obj[fnc];}
    if(args == "undefined"){
        retvalue = obj[fnc]();}
    else{
        if(!IsArray(args)){args = [args];}
        retvalue = obj[fnc](...args);}
    return toTobaMap(retvalue);
}


function ListToF32Ptr(data){
    var data_ptr = Module._malloc(data.length * 4);
    Module.HEAPF32.set(data, data_ptr>>2);
    return data_ptr;
}
function ListToF64Ptr(data){
    var data_ptr = Module._malloc(data.length * 8);
    Module.HEAPF64.set(data, data_ptr>>3);
    return data_ptr;
}
function ListToI32Ptr(data){
    var data_ptr = Module._malloc(data.length * 4);
    Module.HEAP32.set(data, data_ptr>>2);
    return data_ptr;
}
function ListToU8Ptr(data){
    var data_ptr = Module._malloc(data.length);
    Module.HEAP8.set(data, data_ptr);
    return data_ptr;
}
function DeletePtr(ptr){
    Module._free(ptr);
}

function PtrU8(ptr, index){
    return Module.HEAP8[ptr + index];
}
function PtrI32(ptr, index){
    return Module.HEAP32[(ptr + index*4) >> 2];
}
function PtrF32(ptr, index){
    return Module.HEAPF32[(ptr + index*4) >> 2];
}
function PtrF64(ptr, index){
    return Module.HEAPF64[(ptr + index*8) >> 3];
}

var jsStr = "";
function jsPrintf(data){

    // console.log(Module.HEAP8[data]);
    // console.log(Module.HEAP8[data + 1]);
    // var size = 0;
    // while (PtrU8(data, size)) {size++;}
    // var str = new Uint8Array(
    //     Module.HEAP8.buffer, data, size);
    // str = String.fromCharCode.apply(null, str);


    var str = Module.AsciiToString(data);
    jsStr = jsStr.concat(str);
    if (jsStr.includes("\n")){
        if(jsStr.length > 1){
            jsLog.push(jsStr);
            console.log(jsStr);
            jsStr = "";}}

    // DeletePtr(data);
}

function GetLog(){
    if(jsLog.length){
        return toTobaMap(jsLog);}
    return Null();
}

function IsUndefined(item){
    return item === undefined;
}
function IsBoolean(item){
    return typeof item === 'boolean';
}
function IsNumber(item){
    return typeof item === 'number';
}
function IsString(item){
    return typeof item === 'string';
}
function IsArray(item){
    return Array.isArray(item) === true;
}
function IsNumericArray(array) {
    return array.every(element => {
        return typeof element === 'number';
    });
}

function Null(){
    return 0;
}


function LoadScript() {

    // var string = LZString.decompressFromBase64(ccode);
    // ccode = Array.from(string , (x) => x.charCodeAt(0));
    // // console.log(ccode);


    ccode_ptr = ListToU8Ptr(ccode);
    var jsStartProgram = Module.cwrap(
        "WebStartProgram", null, ["number", "number"]);
    jsStartProgram(ccode_ptr, ccode.length);
    DeletePtr(ccode_ptr);
}

function UnLoadScript() {
    var jsDeleteProgram = Module.cwrap(
        "WebDeleteProgram", null, []);
    jsDeleteProgram();
}

function ScriptCallBack(){
    jsCallbackHandle(TobaHandle);}
    //jsCallback();}


// function _TobaInit_() {
//     Module.onRuntimeInitialized = () => { LoadScript(); }
//     window.addEventListener('beforeunload', function () {
//         UnLoadScript()});
// }

function isIterable(obj) {
    // checks for null and undefined
    if (obj == null) {
      return false;}
    return typeof obj[Symbol.iterator] === 'function';
  }

//   function loadJS(file) {
//     // DOM: Create the script element
//     var jsElm = document.createElement("script");
//     // set the type attribute
//     jsElm.type = "application/javascript";
//     // make the script element load file
//     jsElm.src = file;
//     // finally insert the element to the body element in order to load the script
//     document.body.appendChild(jsElm);
// }

function ImportScript(src, callback, args){
    var head = document.getElementsByTagName("head")[0];
    var script = document.createElement("script"); 
    script.setAttribute("type", "text/javascript");
    script.setAttribute("src", src);
    head.addEventListener("load", function(event) {
        if (event.target.nodeName === "SCRIPT"){
            if(isIterable(args)){callback(...args);}
            else{callback();}}
    }, true);
    head.appendChild(script); 
}

function _TobaInit_() {
    // ImportScript("toba_script.js", LoadScript);
    Module.onRuntimeInitialized = () => { LoadScript(); }
    window.addEventListener('beforeunload', function () {
        UnLoadScript()});
}


function JsReadMapVar(data){
    var dsize = PtrF64(data, 0);
    let listvar = new Array(dsize);
    //console.log("\nReadMapVar lenght:", dsize);
    for(i=2; i<2+dsize; i++){
        var id = i - 2;
        var pitem = PtrF64(data, i);
        var startv = pitem + 2;
        var sitem = PtrF64(data, pitem);
        var titem = PtrF64(data, pitem + 1);
        //console.log("\tReadMapVar: item_type", titem);
        //console.log("\tReadMapVar: item_size", sitem);
        if(titem == 8){//MAP type
            var mdata = data+pitem*8;
            var jsdata = JsReadMapVar(mdata);
            // console.log(listvar, jsdata, jsWriteMapVar(jsdata));
            i = i + jsWriteMapVar(jsdata).length;
            listvar[id] = jsdata;
            continue;
        }
        else{//NUM STR type
            if(sitem >= 1){
                var jsdata = new Float64Array(
                    Module.HEAPF64.buffer, 
                    data+startv*8, sitem);
                jsdata = Array.from(jsdata);
                if(jsdata.length == 1){
                    jsdata = jsdata[0];}
            }
            if(titem == 3){//STR type
                jsdata = String.fromCharCode.apply(
                    null, jsdata);
            }
        }
        listvar[id] = jsdata;
    }
    return listvar;
}

function jsWriteMapVar(data){ 

    //bug : data = [["abc", "abc"]]

    var header = [];
    if(IsUndefined(data)){
        data = ["undefined"];}
    else if(IsBoolean(data)){
        data = [Number(data)];}
    else if(IsString(data) || IsNumber(data)){
        data = [data];}
    var start = 2 + data.length;
    header.push(data.length);
    header.push(8);//mapvar
    header.push(start);
    var dsize = 0;
    for(i=0; i<data.length-1; i++){
        var vsize = 0;
        if(IsNumber(data[i])){vsize = 1;}
        else{vsize = data[i].length;}
        dsize += 2 + vsize;
        header.push(start + dsize);
    }
    var mapvar = header;
    for(i=0; i<data.length; i++){
        if(IsNumber(data[i])){ //single num
            var dat = [1, 2].concat(data[i]); //numtype
            mapvar = mapvar.concat(dat);}
        if(IsString(data[i])){//string
            asciiKeys = [];
            for (var s = 0; s < data[i].length; s++){
              asciiKeys.push(data[i][s].charCodeAt(0));}
            var dat = [data[i].length, 3].concat(asciiKeys); //strtype
            mapvar = mapvar.concat(dat);}
        if(IsArray(data[i])){
            // if(IsNumericArray(data[i])){ // num array
            //     var dat = [data[i].length, 2].concat(data[i]); //numtype
            //     mapvar = mapvar.concat(dat);}
            // else{//maptype
            // }
            var dat = [data[i].length, 2].concat(data[i]); //numtype
            mapvar = mapvar.concat(dat); 
        }
        
    }
    return mapvar;
}

function toTobaMap(data){
    return ListToF64Ptr(jsWriteMapVar(data));
}

function DomAppend(item, data){
    $( item ).append(data);
}
function DomRemove(item, data){
    $( item ).remove(data);
}
function DomBefore(item, data){
    $( item ).before( data );
}
function DomAfter(item, data){
    $( item ).after( data );
}
function DomWrap(item, data){
    $( item ).wrap( data );
}
function DomWrapAll(item, data){
    $( item ).wrapAll( data );
}
function DomHasClass(item, data){
    return toTobaMap($( item ).hasClass(data));
}
function DomAddClass(item, data){
    $( item ).addClass(data);
}
function DomRemoveClass(item, data){
    $( item ).removeClass(data);
}
function DomToggleClass(item, data){
    $( item ).toggleClass(data);
}
function DomGetAttr(item, attr){
    return toTobaMap($( item ).attr( attr ));
}
function DomSetAttr(item, attr, value){
    $( item ).attr( attr, value );
}
function DomRemoveAttr(item, attr){
    $( item ).removeAttr( attr );
}
function DomWidth(item){
    return toTobaMap($( item ).width());
}
function DomHeight(item){
    return toTobaMap($( item ).height());
}
function DomGetPosition(item){
    var offset = $( item ).offset();
    var pos = [offset.left, offset.top];
    return toTobaMap(pos);
}
function DomSetPosition(item, x, y){
    $( item ).offset({left: x, top: y});
}
function DomGetText(item){
    return toTobaMap($( item ).text());
}
function DomSetText(item, value){
    $( item ).text(value);
}
function DomGetVal(item){
    return toTobaMap($( item ).val());
}
function DomGetProp(item, key){
    return toTobaMap($( item ).prop(key));
}
function DomGetHtml(item){
    return toTobaMap($( item ).html());
}
function DomGetCss(item, key){
    return toTobaMap( $( item ).css( key ));
}
function DomSetCss(item, key, value){
    $( item ).css( key, value );
}

function DomGetStyle(item, key){
    var style = getComputedStyle($( item )[0]);
    return toTobaMap( style.getPropertyValue(key));
}
function DomSetStyle(item, key, value){
    var item = $( item )[0];
    item.style.setProperty(key, value);
}

function ShowModal(item){
    $( item )[0].showModal();
}
function Trigger(item, fnc){
    $( item ).trigger(fnc);
}
function SetLocalStorage(item, value){
    value = JSON.stringify(value);
    localStorage.setItem(item, value);
}
function GetLocalStorage(item){
    var value = localStorage.getItem(item);
    return toTobaMap(JSON.parse(value));
}
function ClearItemLocalStorage(item){
    localStorage.removeItem(item);
}
function ClearLocalStorage(){
    localStorage.clear();
}
function SizeLocalStorage(){
    return toTobaMap(localStorage.length);
}
function KeysLocalStorage(){
    if(localStorage.length){
        var keys = Object.keys(localStorage);
        return toTobaMap(keys);}
     return Null();
}
function isTouchDevice(){
    var result = 0;
    var isTouchDevice =
        (('ontouchstart' in window) ||
            (navigator.MaxTouchPoints > 0) ||
            (navigator.msMaxTouchPoints > 0));
    if (!isTouchDevice) {result = 0;} 
    else {result = 1;}
    return toTobaMap(result);
}
function TriggeringReflow(item){
    void $( item )[0].offsetWidth;
}

function ReadFile(item, file){
    fetch(file)
    .then(response => response.text())
    .then(text => ObjectReferences[item].setValue(text))
   
}

function RedirectConsole(item){
    // (function () {
    //     // var old = console.log;
    //     var logger = $( item )[0];
    //     console.log = function (message) {
    //         // if (typeof message == 'object') {
    //         //     logger.innerHTML += (JSON && JSON.stringify ? JSON.stringify(message) : message) + '<br />';} 
    //         // else {logger.innerHTML += message + '<br />';}
    //         // logger.innerHTML += message + '<br />';
    //         // $( item ).trigger("change", message);
    //         // var event = new Event('change');
    //         // logger.dispatchEvent(event);

    //         // jsEvtList.push([item, message, 0]);
    //         // ScriptCallBack();

    //     }
    // })();
}

function SplitItem(item1, item2, split_direction){
    Split([item1, item2], {
        direction: split_direction,
        minSize: 0,
        gutterSize: 9,
        gutterAlign: 'center',
        snapOffset: 20
    })
}
function SortItem(item){
    var item = $(item)[0]; 
    new Sortable(item);
}

function CodeEditor(item){
    var editor = CodeMirror($( item )[0], {
        mode: "text/x-toba",
        theme: 'ayu-dark',
        // autofocus: true,
        styleActiveLine: true,
        autoCloseBrackets: true,
        matchbrackets: true,
        highlightSelectionMatches: { showToken: /\w/, annotateScrollbar: false },
        autoRefresh: true
    });
    editor.refresh();
    return toTobaMap(StoreObject(editor));
}



function NumFromId(id){
    id = id.replace("_", "");
    id = id.replace("id", "");
    id = parseInt(id);
    return id;
}

function GetEventInfo(event){

    if(event.type == 'change'){
        return event.target.value;
    }
    if(event.type == 'animationend'){
        return [event.animationName, event.elapsedTime];
    }
    if (event.type == 'touchstart' ||
        event.type == 'touchmove' ||
        event.type == 'touchend' ||
        event.type == 'touchcancel' ||
        event.type == 'mousedown' ||
        event.type == 'mouseup' ||
        event.type == 'mousemove' ||
        event.type == 'mouseover' ||
        event.type == 'mouseout' ||
        event.type == 'mouseenter' ||
        event.type == 'mouseleave') {

        var eventDoc, doc, body;
        event = event || window.event; // IE-ism
        if (event.type == 'touchstart' ||
            event.type == 'touchmove' ||
            event.type == 'touchend' ||
            event.type == 'touchcancel') {

            var touch = event.touches[0];
            event.pageX = touch.pageX;
            event.pageY = touch.pageY;
            event.clientX = touch.clientX;
            event.clientY = touch.clientY;
        }
        if (event.pageX == null && event.clientX != null) {
            eventDoc = (event.target && event.target.ownerDocument) || document;
            doc = eventDoc.documentElement;
            body = eventDoc.body;
            event.pageX = event.clientX +
                (doc && doc.scrollLeft || body && body.scrollLeft || 0) -
                (doc && doc.clientLeft || body && body.clientLeft || 0);
            event.pageY = event.clientY +
                (doc && doc.scrollTop  || body && body.scrollTop  || 0) -
                (doc && doc.clientTop  || body && body.clientTop  || 0 );
        }
        return [event.pageX, event.pageY];
    }
    return [null, null];
}

function TimeOutEvent(ms, callback, data){
    setTimeout(function() {
        jsEvtList.push([-1, callback, data]);
        ScriptCallBack();
    }, ms);  
}

function AddEvent(item, evtype) {
    var index = jsEvents.indexOf(evtype);
    var _item = document.querySelector(item);
    _item.addEventListener(evtype, (event) => {
        var idevt = event.target.id
        var data = GetEventInfo(event);
        jsEvtList.push([idevt, data, index]);
        ScriptCallBack();
    });
}

function LastEvent(){
    if(jsEvtList.length){
        var levt = jsEvtList.shift();
        if(levt[0] == TIMEOUTEVENT){
            var callback = levt[1];
            var data = levt[2];
            return toTobaMap(
                [TIMEOUTEVENT, callback, data]);}
        else{
            var idevt = NumFromId(levt[0]);
            var data = levt[1];
            var index = levt[2];
            return toTobaMap([idevt, data, index]);}
    }
    return Null();
}

function jsEmFunctionMap(data){
    var index = 0;
    jsdata = JsReadMapVar(data);
    var id = jsdata[0];
    var nargs = jsdata.length - 1;

    if(id == index++){DomAppend(jsdata[1], jsdata[2]);}
    if(id == index++){DomRemove(jsdata[1], jsdata[2]);}
    if(id == index++){DomBefore(jsdata[1], jsdata[2]);}
    if(id == index++){DomAfter(jsdata[1], jsdata[2]);}
    if(id == index++){DomWrap(jsdata[1], jsdata[2]);}
    if(id == index++){DomWrapAll(jsdata[1], jsdata[2]);}
    if(id == index++){return DomHasClass(jsdata[1], jsdata[2]);} 
    if(id == index++){DomAddClass(jsdata[1], jsdata[2]);}
    if(id == index++){DomRemoveClass(jsdata[1], jsdata[2]);}
    if(id == index++){DomToggleClass(jsdata[1], jsdata[2]);}
    if(id == index++){return DomGetAttr(jsdata[1], jsdata[2]);} 
    if(id == index++){DomSetAttr(jsdata[1], jsdata[2], jsdata[3]);}
    if(id == index++){DomRemoveAttr(jsdata[1], jsdata[2]);}
    if(id == index++){return DomWidth(jsdata[1]);}
    if(id == index++){return DomHeight(jsdata[1]);}

    if(id == index++){return DomGetPosition(jsdata[1]);}
    if(id == index++){DomSetPosition(jsdata[1], jsdata[2], jsdata[3]);}
    
    if(id == index++){return DomGetText(jsdata[1]);}
    if(id == index++){DomSetText(jsdata[1], jsdata[2]);}
    if(id == index++){return DomGetVal(jsdata[1]);}
    if(id == index++){return DomGetProp(jsdata[1], jsdata[2]);}
    if(id == index++){return DomGetHtml(jsdata[1]);}
    if(id == index++){return DomGetCss(jsdata[1], jsdata[2]);}
    if(id == index++){DomSetCss(jsdata[1], jsdata[2], jsdata[3]);}
    if(id == index++){return DomGetStyle(jsdata[1], jsdata[2]);}
    if(id == index++){DomSetStyle(jsdata[1], jsdata[2], jsdata[3]);}

    if(id == index++){ShowModal(jsdata[1]);}
    if(id == index++){Trigger(jsdata[1], jsdata[2]);}
    if(id == index++){AddEvent(jsdata[1], jsdata[2]);}
    if(id == index++){return LastEvent();}

    if(id == index++){return isTouchDevice();}
    if(id == index++){TriggeringReflow(jsdata[1]);}

    if(id == index++){SetLocalStorage(jsdata[1], jsdata[2]);}
    if(id == index++){return GetLocalStorage(jsdata[1]);}
    if(id == index++){ClearItemLocalStorage(jsdata[1]);}
    if(id == index++){ClearLocalStorage();}
    if(id == index++){return SizeLocalStorage();}
    if(id == index++){return KeysLocalStorage();}

    if(id == index++){SplitItem(jsdata[1], jsdata[2], jsdata[3]);}
    if(id == index++) {SortItem(jsdata[1]);}
    if(id == index++) {return CodeEditor(jsdata[1]);}
    if(id == index++) {return ObjectRef(jsdata[1], jsdata[2], jsdata[3]);}
    if(id == index++) {RedirectConsole(jsdata[1]);}
    if(id == index++) {return GetLog();}
    if(id == index++) {ReadFile(jsdata[1], jsdata[2]);}
    if(id == index++) {TimeOutEvent(jsdata[1], jsdata[2], jsdata[3]);}
    

    return Null();
}



