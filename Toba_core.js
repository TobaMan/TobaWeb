
var jsEvtList = [];

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
    "keydown"
];

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

function PtrI32(ptr, index){
    return Module.HEAP32[(ptr + index*4) >> 2];
}
function PtrF32(ptr, index){
    return Module.HEAPF32[(ptr + index*4) >> 2];
}
function PtrF64(ptr, index){
    return Module.HEAPF64[(ptr + index*8) >> 3];
}

function Null(){
    return 0;
}

function JsReadMapVar(data){
    //dic = {};
    var dsize = PtrF64(data, 0);
    let listvar = new Array(dsize);
    //console.log("\nReadMapVar lenght:", dsize);
    for(i=2; i<2+dsize; i++){
        //var id = String(i - 2);
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
            // console.log(listvar, jsdata);
        }
        else{//NUM STR type
            if(sitem == 1){
                var jsdata = PtrF64(data, startv);
            }
            if(sitem > 1){
                var jsdata = new Float64Array(
                    Module.HEAPF64.buffer, 
                    data+startv*8, sitem);
                jsdata = Array.from(jsdata);
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
    var header = [];
    if(typeof data === 'number'){
        data = [data];}
    if(typeof data === 'string'){
        data = [data];}
    var start = 2 + data.length;
    header.push(data.length);
    header.push(8);//mapvar
    header.push(start);
    var dsize = 0;
    for(i=0; i<data.length-1; i++){
        var vsize = 0;
        if(typeof data[i] === 'number'){
            vsize = 1;}
        else{vsize = data[i].length;}
        dsize += 2 + vsize;
        header.push(start + dsize);
    }
    var mapvar = header;
    for(i=0; i<data.length; i++){
        if(typeof data[i] === 'number'){
            var dat = [1, 2].concat(data[i]); //numtype
            mapvar = mapvar.concat(dat);
        }
        if(Array.isArray(data[i]) === true){
            var dat = [data[i].length, 2].concat(data[i]); //numtype
            mapvar = mapvar.concat(dat);
        }
        if(typeof data[i] === 'string'){
            asciiKeys = [];
            for (var s = 0; s < data[i].length; s ++)
              asciiKeys.push(data[i][s].charCodeAt(0));
            var dat = [data[i].length, 3].concat(asciiKeys); //strtype
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
    //Wrap an HTML structure around each element in the set of matched elements.
    $( item ).wrap( data );
}
function DomWrapAll(item, data){
    //Wrap an HTML structure around all elements in the set of matched elements.
    $( item ).wrapAll( data );
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
    // console.log(item, $( item ).offset());
    var offset = $( item ).offset();
    var pos = [offset.left, offset.top];
    // console.log(pos);
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
function DomVal(item){
    return toTobaMap($( item ).val());
}
function DomHtml(item){
    return toTobaMap($( item ).html());
}
function DomGetCss(item, key){
    return toTobaMap( $( item ).css( key ));
}
function DomSetCss(item, key, value){
    $( item ).css( key, value );
}
function DomShow(item){
    $( item )[0].showModal();
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
function SplitItem(item1, item2, split_direction){
    Split([item1, item2], {
        direction: split_direction,
        gutterSize: 2,
        gutterAlign: 'center',
        expandToMin: true,
    })
}

function DragItem(item){
    dragula([$( item )]);
}

function NumFromId(id){
    id = id.replace("_", "");
    id = id.replace("id", "");
    id = parseInt(id);
    return id;
}

function jsOnEvent(id, event, evtype){
    jsEvtList.push([id, GetPosition(event), evtype]);
}

function AddEvent(item, evtype) {
    // console.log("AddEvent", item, evtype);
    var index = jsEvents.indexOf(evtype);
    var _item = document.querySelector(item);
    _item.addEventListener(evtype, (event) => {
        // var screenpos = GetPosition(event);
        // var clientpos = [event.offsetX, event.offsetY];
        // var data = [screenpos, clientpos];
        var data = GetPosition(event);
        // console.log(event.target.id, data, index);
        jsEvtList.push([event.target.id, data, index]);
        // RunCallBack();
    });
}

function LastEvent(){
    if(jsEvtList.length){
        // var levt = jsEvtList.pop();
        var levt = jsEvtList.shift();
        var idevt = NumFromId(levt[0]);
        var evtdata = levt[1];
        var tevt = levt[2];
        return toTobaMap(
            [idevt, evtdata, tevt]);
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
    if(id == index++){return DomVal(jsdata[1]);}
    if(id == index++){return DomHtml(jsdata[1]);}
    if(id == index++){return DomGetCss(jsdata[1], jsdata[2]);}
    if(id == index++){DomSetCss(jsdata[1], jsdata[2], jsdata[3]);}

    if(id == index++){DomShow(jsdata[1]);}
    if(id == index++){AddEvent(jsdata[1], jsdata[2]);}
    if(id == index++){return LastEvent();}

    if(id == index++){SetLocalStorage(jsdata[1], jsdata[2]);}
    if(id == index++){return GetLocalStorage(jsdata[1]);}
    if(id == index++){ClearItemLocalStorage(jsdata[1]);}
    if(id == index++){ClearLocalStorage();}
    if(id == index++){return SizeLocalStorage();}
    if(id == index++){return KeysLocalStorage();}

    if(id == index++){SplitItem(jsdata[1], jsdata[2], jsdata[3]);}
    if(id == index++){DragItem(jsdata[1]);}
    
    return Null();
}


function GetPosition(event){
    var eventDoc, doc, body;
    event = event || window.event; // IE-ism
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

function LoadScript() {
    ccode_ptr = ListToU8Ptr(ccode);
    var jsStartProgram = Module.cwrap(
        "StartProgram", null, ["number", "number"]);
    jsStartProgram(ccode_ptr, ccode.length);
    DeletePtr(ccode_ptr);
}

function RunCallBack(){
    var jsCallBack = Module.cwrap(
        "CallbackFunction", null, null);
    jsCallBack();
}

function _TobaInit_(){
    window.addEventListener('load', function () {
        LoadScript();
    })
}

